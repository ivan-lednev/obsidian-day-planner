import { Plugin, WorkspaceLeaf } from "obsidian";
import { get, writable, Writable } from "svelte/store";

import {
  errorContextKey,
  obsidianContext,
  viewTypeTimeline,
  viewTypeWeekly,
} from "./constants";
import { settings } from "./global-store/settings";
import { DataviewFacade } from "./service/dataview-facade";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { STaskEditor } from "./service/stask-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import { ObsidianContext } from "./types";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { ConfirmationModal } from "./ui/confirmation-modal";
import { ReleaseNotesModal } from "./ui/release-notes-modal";
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

    this.handleNewPluginVersion();

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
    await this.detachLeavesOfType(viewTypeTimeline);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: viewTypeTimeline,
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
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: viewTypeTimeline,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  };

  private handleNewPluginVersion() {
    if (this.settings().pluginVersion === currentPluginVersion) {
      return;
    }

    this.settingsStore.update((previous) => ({
      ...previous,
      pluginVersion: currentPluginVersion,
    }));

    if (this.settings().releaseNotes) {
      this.showReleaseNotes();
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

  private showReleaseNotes = () => {
    const modal = new ReleaseNotesModal(this);
    modal.open();
  };

  private registerViews() {
    const {
      editContext,
      tasksForToday,
      visibleTasks,
      dataviewLoaded,
      isModPressed,
      // todo: this doesn't fit method name, move out
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

    const errorStore = writable<Error | undefined>();

    // todo: move out
    // todo: pass context with day
    new StatusBarWidget({
      target: this.addStatusBarItem(),
      props: {
        onClick: this.initTimelineLeaf,
        tasksForToday,
        errorStore,
      },
    });

    this.register(newlyStartedTasks.subscribe(notifyAboutStartedTasks));
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
  }
}
