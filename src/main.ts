import { flow } from "lodash/fp";
import {
  Keymap,
  MarkdownFileInfo,
  MarkdownView,
  Plugin,
  WorkspaceLeaf,
} from "obsidian";
import { STask } from "obsidian-dataview";
import { get, readable, Writable } from "svelte/store";
import { isInstanceOf, isNotVoid } from "typed-assert";

import {
  editContextKey,
  obsidianContext,
  viewTypeTimeline,
  viewTypeWeekly,
} from "./constants";
import { currentTime } from "./global-store/current-time";
import { settings } from "./global-store/settings";
import { ReleaseNotesModal } from "./release-notes-modal";
import { DataviewFacade } from "./service/dataview-facade";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { useNewlyStartedTasks } from "./use-newly-started-tasks";
import {
  assertActiveClock,
  assertNoActiveClock,
  withActiveClock,
  withActiveClockCompleted,
  withoutActiveClock,
} from "./util/clock";
import { createHooks } from "./util/create-hooks";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { replaceSTaskInFile, toMarkdown } from "./util/dataview";
import { locToEditorPosition } from "./util/editor";
import { handleActiveLeafChange } from "./util/handle-active-leaf-change";
import { withNotice } from "./util/with-notice";

export default class DayPlanner extends Plugin {
  settings!: () => DayPlannerSettings;
  private settingsStore!: Writable<DayPlannerSettings>;
  private obsidianFacade!: ObsidianFacade;
  private planEditor!: PlanEditor;
  private dataviewFacade!: DataviewFacade;

  async onload() {
    await this.initSettingsStore();

    if (this.settings().pluginVersion !== currentPluginVersion) {
      this.settingsStore.update((previous) => ({
        ...previous,
        pluginVersion: currentPluginVersion,
      }));
      this.showReleaseNotes();
    }

    this.obsidianFacade = new ObsidianFacade(this.app);
    this.dataviewFacade = new DataviewFacade(this.app);
    this.planEditor = new PlanEditor(this.settings, this.obsidianFacade);

    this.registerViews();
    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    this.registerCommands();

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", handleActiveLeafChange),
    );
  }

  async onunload() {
    return Promise.all([
      this.detachLeavesOfType(viewTypeTimeline),
      this.detachLeavesOfType(viewTypeWeekly),
    ]);
  }

  initWeeklyLeaf = async () => {
    await this.detachLeavesOfType(viewTypeWeekly);
    await this.app.workspace.getLeaf(false).setViewState({
      type: viewTypeWeekly,
      active: true,
    });
  };

  initTimelineLeaf = async () => {
    await this.detachLeavesOfType(viewTypeTimeline);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: viewTypeTimeline,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  };

  // todo: move out
  // todo: use a more descriptive name
  handleMouseEnter = (el: HTMLElement, path: string, line = 0) => {
    // @ts-ignore
    if (!this.app.internalPlugins.plugins["page-preview"].enabled) {
      return;
    }

    const previewLocation = {
      scroll: line,
    };

    this.app.workspace.trigger("link-hover", {}, el, path, "", previewLocation);
  };

  private registerCommands() {
    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show the Day Planner Timeline",
      callback: async () => await this.initTimelineLeaf(),
    });

    this.addCommand({
      id: "show-weekly-view",
      name: "Show the Week Planner",
      callback: this.initWeeklyLeaf,
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: async () =>
        this.app.workspace
          .getLeaf(false)
          .openFile(await createDailyNoteIfNeeded(window.moment())),
    });

    this.addCommand({
      id: "insert-planner-heading-at-cursor",
      name: "Insert Planner Heading at Cursor",
      editorCallback: (editor) =>
        editor.replaceSelection(this.planEditor.createPlannerHeading()),
    });
  }

  private async initSettingsStore() {
    settings.set({ ...defaultSettings, ...(await this.loadData()) });

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

  private getSTaskUnderCursor = (view: MarkdownFileInfo) => {
    isInstanceOf(
      view,
      MarkdownView,
      "You can only get tasks from markdown editor views",
    );

    const file = view.file;

    isNotVoid(file, "There is no file for view");

    const sTask = this.dataviewFacade
      .getTasksFromPath(file.path)
      .find((sTask: STask) => sTask.line === view.editor.getCursor().line);

    isNotVoid(sTask, "There is no task under cursor");

    return sTask;
  };

  // todo: move out
  private getSTaskUnderCursorFromLastView = () => {
    const view = this.obsidianFacade.getActiveMarkdownView();
    return this.getSTaskUnderCursor(view);
  };

  // todo: move out
  private replaceSTaskUnderCursor = (newMarkdown: string) => {
    const view = this.obsidianFacade.getActiveMarkdownView();
    const sTask = this.getSTaskUnderCursorFromLastView();

    view.editor.replaceRange(
      newMarkdown,
      locToEditorPosition(sTask.position.start),
      locToEditorPosition(sTask.position.end),
    );
  };

  // todo: move out
  private clockInUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertNoActiveClock,
      withActiveClock,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );
  // todo: move out
  private clockOutUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertActiveClock,
      withActiveClockCompleted,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );
  // todo: move out
  private cancelClockUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertActiveClock,
      withoutActiveClock,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );

  private showReleaseNotes = () => {
    const modal = new ReleaseNotesModal(this);
    modal.open();
  };

  private registerViews() {
    const { editContext, tasksForToday, visibleTasks, dataviewLoaded } =
      createHooks({
        app: this.app,
        dataviewFacade: this.dataviewFacade,
        obsidianFacade: this.obsidianFacade,
        settingsStore: this.settingsStore,
        planEditor: this.planEditor,
      });

    const clockOut = withNotice(async (sTask: STask) => {
      await this.obsidianFacade.editFile(sTask.path, (contents) =>
        replaceSTaskInFile(
          contents,
          sTask,
          toMarkdown(withActiveClockCompleted(sTask)),
        ),
      );
    });

    const cancelClock = withNotice(async (sTask: STask) => {
      await this.obsidianFacade.editFile(sTask.path, (contents) =>
        replaceSTaskInFile(
          contents,
          sTask,
          toMarkdown(withoutActiveClock(sTask)),
        ),
      );
    });

    new StatusBarWidget({
      target: this.addStatusBarItem(),
      props: {
        onClick: this.initTimelineLeaf,
        tasksForToday,
      },
    });

    const newlyStartedTasks = useNewlyStartedTasks({
      settings,
      tasksForToday,
      currentTime,
    });

    this.register(
      newlyStartedTasks.subscribe((tasks) => {
        if (tasks.length > 0) {
          new Notification(`Task started: ${tasks[0].firstLineText}`);
        }
      }),
    );

    // todo: move out
    const isModPressed = readable(false, (set) => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (Keymap.isModifier(event, "Mod")) {
          set(true);
        }
      };

      const handleKeyUp = (event: KeyboardEvent) => {
        if (!Keymap.isModifier(event, "Mod")) {
          set(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
      };
    });

    // todo: make it dependent on config
    // todo: type this
    const defaultObsidianContext: object = {
      obsidianFacade: this.obsidianFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshTasks: this.dataviewFacade.getAllTasksFrom,
      dataviewLoaded,
      renderMarkdown: createRenderMarkdown(this.app),
      showReleaseNotes: this.showReleaseNotes,
      editContext,
      visibleTasks,
      clockOut,
      cancelClock,
      clockOutUnderCursor: this.clockOutUnderCursor,
      clockInUnderCursor: this.clockInUnderCursor,
      cancelClockUnderCursor: this.cancelClockUnderCursor,
      handleMouseEnter: this.handleMouseEnter,
      isModPressed,
    };

    // TODO: move out building context
    const componentContext = new Map([
      [obsidianContext, defaultObsidianContext],
      [editContextKey, { editContext }],
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(leaf, this.settings, componentContext),
    );

    this.registerView(
      viewTypeWeekly,
      (leaf: WorkspaceLeaf) =>
        new WeeklyView(leaf, this.settings, componentContext),
    );
  }
}
