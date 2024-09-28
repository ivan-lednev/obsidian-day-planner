import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { mount } from "svelte";
import { get, writable, type Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import {
  errorContextKey,
  obsidianContext,
  viewTypeReleaseNotes,
  viewTypeTimeline,
  viewTypeWeekly,
} from "./constants";
import { settings } from "./global-store/settings";
import {
  compareByTimestampInText,
  fromMarkdown,
  positionContainsPoint,
  sortListsRecursively,
  toEditorPos,
  toMarkdown,
  toMdastPoint,
} from "./mdast/mdast";
import { DataviewFacade } from "./service/dataview-facade";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { STaskEditor } from "./service/stask-editor";
import { type DayPlannerSettings, defaultSettings } from "./settings";
import type { ObsidianContext } from "./types";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { ConfirmationModal } from "./ui/confirmation-modal";
import { DayPlannerReleaseNotesView } from "./ui/release-notes";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { createHooks } from "./util/create-hooks";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createShowPreview } from "./util/create-show-preview";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { notifyAboutStartedTasks } from "./util/notify-about-started-tasks";
import { getUpdateTrigger } from "./util/store";

export default class DayPlanner extends Plugin {
  settings!: () => DayPlannerSettings;
  private settingsStore!: Writable<DayPlannerSettings>;
  private obsidianFacade!: ObsidianFacade;
  private planEditor!: PlanEditor;
  private dataviewFacade!: DataviewFacade;
  private sTaskEditor!: STaskEditor;

  async onload() {
    await this.initSettingsStore();

    this.obsidianFacade = new ObsidianFacade(this.app);
    this.dataviewFacade = new DataviewFacade(this.app);
    this.planEditor = new PlanEditor(this.settings, this.obsidianFacade);
    this.sTaskEditor = new STaskEditor(
      this.obsidianFacade,
      this.dataviewFacade,
    );

    this.registerViews();
    this.registerCommands();

    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    await this.handleNewPluginVersion();
    await this.initTimelineLeafSilently();
  }

  async onunload() {
    return Promise.all([
      this.detachLeavesOfType(viewTypeTimeline),
      this.detachLeavesOfType(viewTypeWeekly),
    ]);
  }

  initWeeklyLeaf = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeWeekly,
      active: true,
    });
  };

  initTimelineLeafSilently = async () => {
    this.app.workspace.onLayoutReady(async () => {
      const [firstExistingTimeline] =
        this.app.workspace.getLeavesOfType(viewTypeTimeline);
      if (firstExistingTimeline) {
        return;
      }

      await this.detachLeavesOfType(viewTypeTimeline);

      await this.app.workspace.getRightLeaf(false)?.setViewState({
        type: viewTypeTimeline,
      });
    });
  };

  initTimelineLeaf = async () => {
    const [firstExistingTimeline] =
      this.app.workspace.getLeavesOfType(viewTypeTimeline);

    if (firstExistingTimeline) {
      this.app.workspace.revealLeaf(firstExistingTimeline);
      return;
    }

    await this.detachLeavesOfType(viewTypeTimeline);
    await this.app.workspace.getRightLeaf(false)?.setViewState({
      type: viewTypeTimeline,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  };

  private async handleNewPluginVersion() {
    if (this.settings().pluginVersion === currentPluginVersion) {
      return;
    }

    this.settingsStore.update((previous) => ({
      ...previous,
      pluginVersion: currentPluginVersion,
    }));

    if (this.settings().releaseNotes) {
      this.app.workspace.onLayoutReady(async () => {
        await this.showReleaseNotes();
      });
    }
  }

  private registerCommands() {
    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show timeline",
      callback: async () => await this.initTimelineLeaf(),
    });

    this.addCommand({
      id: "show-weekly-view",
      name: "Show week planner",
      callback: this.initWeeklyLeaf,
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: async () => {
        const dailyNote = await createDailyNoteIfNeeded(window.moment());

        await this.app.workspace.getLeaf(false).openFile(dailyNote);
      },
    });

    this.addCommand({
      id: "insert-planner-heading-at-cursor",
      name: "Insert Planner Heading at Cursor",
      editorCallback: (editor) =>
        editor.replaceSelection(this.planEditor.createPlannerHeading()),
    });

    this.addCommand({
      id: "reorder-tasks-by-time",
      name: "Sort tasks under cursor by time",
      editorCallback: (editor) => {
        const mdastRoot = fromMarkdown(editor.getValue());
        const cursorPoint = toMdastPoint(editor.getCursor());

        const list = mdastRoot.children.find(
          (rootContent) =>
            rootContent.position &&
            positionContainsPoint(rootContent.position, cursorPoint),
        );

        if (!list) {
          new Notice("There is no list under cursor");

          return;
        }

        const sorted = sortListsRecursively(list, compareByTimestampInText);
        const updatedText = toMarkdown(sorted).trim();

        isNotVoid(sorted.position);

        editor.replaceRange(
          updatedText,
          toEditorPos(sorted.position.start),
          toEditorPos(sorted.position.end),
        );
      },
    });
  }

  private async initSettingsStore() {
    const initialSettings = { ...defaultSettings, ...(await this.loadData()) };

    settings.set(initialSettings);

    this.register(
      settings.subscribe(async (newValue) => {
        await this.saveData(newValue);
      }),
    );

    this.settingsStore = settings;
    this.settings = () => get(settings);
  }

  private async detachLeavesOfType(type: string) {
    // Although this is synchronous, without wrapping into a promise, weird things happen:
    // - when re-initializing the weekly view, it gets deleted every other time instead of getting re-created
    // - or the tabs get hidden
    await this.app.workspace.detachLeavesOfType(type);
  }

  private showReleaseNotes = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeReleaseNotes,
      active: true,
    });
  };

  private registerViews() {
    const {
      editContext,
      tasksForToday,
      visibleTasks,
      dataviewLoaded,
      isModPressed,
      newlyStartedTasks,
      icalSyncTrigger,
      isOnline,
      isDarkMode,
      dateRanges,
    } = createHooks({
      app: this.app,
      dataviewFacade: this.dataviewFacade,
      obsidianFacade: this.obsidianFacade,
      settingsStore: this.settingsStore,
      planEditor: this.planEditor,
    });

    this.registerDomEvent(window, "blur", editContext.cancelEdit);
    this.registerDomEvent(document, "pointerup", editContext.cancelEdit);
    this.register(
      editContext.cursor.subscribe(({ bodyCursor }) => {
        document.body.style.cursor = bodyCursor;
      }),
    );

    const errorStore = writable<Error | undefined>();

    // todo: move out
    // todo: pass context with day
    mount(StatusBarWidget, {
      target: this.addStatusBarItem(),
      props: {
        onClick: this.initTimelineLeaf,
        tasksForToday,
        errorStore,
      },
    });

    this.register(
      newlyStartedTasks.subscribe((value) =>
        notifyAboutStartedTasks(value, this.settings()),
      ),
    );
    this.addCommand({
      id: "re-sync",
      name: "Re-sync tasks",
      callback: async () => {
        icalSyncTrigger.set(getUpdateTrigger());
      },
    });

    // todo: make it dependent on config
    const defaultObsidianContext: ObsidianContext = {
      obsidianFacade: this.obsidianFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshTasks: this.dataviewFacade.getAllTasksFrom,
      dataviewLoaded,
      renderMarkdown: createRenderMarkdown(this.app),
      toggleCheckboxInFile: this.obsidianFacade.toggleCheckboxInFile,
      showReleaseNotes: this.showReleaseNotes,
      editContext,
      visibleTasks,
      showPreview: createShowPreview(this.app),
      isModPressed,
      reSync: () => icalSyncTrigger.set(getUpdateTrigger()),
      isOnline,
      isDarkMode,
      showConfirmationModal: (props) => {
        new ConfirmationModal(this.app, props).open();
      },
    };

    const componentContext = new Map<
      string,
      ObsidianContext | typeof errorStore
    >([
      [obsidianContext, defaultObsidianContext],
      [errorContextKey, errorStore],
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(leaf, this.settings, componentContext, dateRanges),
    );

    this.registerView(
      viewTypeWeekly,
      (leaf: WorkspaceLeaf) =>
        new WeeklyView(leaf, this.settings, componentContext, dateRanges),
    );

    this.registerView(
      viewTypeReleaseNotes,
      (leaf: WorkspaceLeaf) => new DayPlannerReleaseNotesView(leaf),
    );
  }
}
