import { flow } from "lodash/fp";
import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { getAPI, STask } from "obsidian-dataview";
import { get, Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import {
  editContextKey,
  obsidianContext,
  viewTypeTimeline,
  viewTypeTimeTracker,
  viewTypeWeekly,
} from "./constants";
import { settings } from "./global-store/settings";
import { DataviewFacade } from "./service/dataview-facade";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimeTrackerView from "./ui/time-tracker-view";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import {
  assertActiveClock,
  assertNoActiveClock,
  withActiveClock,
  withActiveClockCompleted,
  withoutActiveClock,
} from "./util/clock";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createHooks } from "./util/createHooks";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { replaceSTaskInFile, toMarkdown } from "./util/dataview";
import { locToEditorPosition } from "./util/editor";
import { handleActiveLeafChange } from "./util/handle-active-leaf-change";
import { withNotice } from "./util/with-notice";

export default class DayPlanner extends Plugin {
  settings: () => DayPlannerSettings;
  private settingsStore: Writable<DayPlannerSettings>;
  private obsidianFacade: ObsidianFacade;
  private planEditor: PlanEditor;
  private dataviewFacade: DataviewFacade;

  async onload() {
    await this.initSettingsStore();

    this.obsidianFacade = new ObsidianFacade(this.app);
    this.dataviewFacade = new DataviewFacade(this.app, this.settings);
    this.planEditor = new PlanEditor(this.settings, this.obsidianFacade);

    this.registerViews();
    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    this.registerCommands();

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", handleActiveLeafChange),
    );

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        // todo: this is duplicated
        const sTask = getAPI(this.app)
          .page(view.file.path)
          ?.file?.tasks?.find(
            (sTask: STask) => sTask.line === view.editor.getCursor().line,
          );

        if (!sTask) {
          return;
        }

        menu.addItem((item) => {
          item
            .setTitle("Clock in")
            .setIcon("play")
            .onClick(this.clockInUnderCursor);
        });

        menu.addItem((item) => {
          item
            .setTitle("Clock out")
            .setIcon("square")
            .onClick(this.clockOutUnderCursor);
        });

        menu.addItem((item) => {
          item
            .setTitle("Cancel clock")
            .setIcon("trash")
            .onClick(this.cancelClockUnderCursor);
        });
      }),
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

  initTimeTrackerLeaf = async () => {
    await this.detachLeavesOfType(viewTypeTimeTracker);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: viewTypeTimeTracker,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  };

  initTimelineLeaf = async () => {
    await this.detachLeavesOfType(viewTypeTimeline);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: viewTypeTimeline,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
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
      id: "show-time-tracker-view",
      name: "Show Time Tracker",
      callback: this.initTimeTrackerLeaf,
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

    this.addCommand({
      id: "clock-into-task-under-cursor",
      name: "Clock into task under cursor",
      callback: this.clockInUnderCursor,
    });

    this.addCommand({
      id: "clock-out-of-task-under-cursor",
      name: "Clock out of task under cursor",
      callback: this.clockOutUnderCursor,
    });

    this.addCommand({
      id: "cancel-clock-under-cursor",
      name: "Cancel clock on task under cursor",
      callback: this.clockOutUnderCursor,
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

  // todo: move out
  private getSTaskUnderCursor = () => {
    const view = this.obsidianFacade.getActiveMarkdownView();

    // TODO: hide dataview api
    const sTask = getAPI(this.app)
      .page(view.file.path)
      ?.file?.tasks?.find(
        (sTask: STask) => sTask.line === view.editor.getCursor().line,
      );

    isNotVoid("There is no task under cursor");

    return sTask;
  };

  // todo: move out
  private replaceSTaskUnderCursor = (newMarkdown: string) => {
    const view = this.obsidianFacade.getActiveMarkdownView();
    const sTask = this.getSTaskUnderCursor();

    view.editor.replaceRange(
      newMarkdown,
      locToEditorPosition(sTask.position.start),
      locToEditorPosition(sTask.position.end),
    );
  };

  // todo: move out
  private clockInUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursor,
      assertNoActiveClock,
      withActiveClock,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );

  // todo: move out
  private clockOutUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursor,
      assertActiveClock,
      withActiveClockCompleted,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );

  // todo: move out
  private cancelClockUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursor,
      assertActiveClock,
      withoutActiveClock,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );

  // todo: split planner context from tracker context
  // todo: initialize reactive graph separately?
  private registerViews() {
    const {
      timeTrackerEditContext,
      editContext,
      tasksForToday,
      sTasksWithActiveClockProps,
      visibleTasks,
    } = createHooks({
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

    const defaultObsidianContext: object = {
      obsidianFacade: this.obsidianFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshTasks: this.dataviewFacade.getTasks,
      dataviewLoaded: this.dataviewFacade.dataviewLoaded,
      renderMarkdown: createRenderMarkdown(this.app),
      editContext,
      visibleTasks,
      sTasksWithActiveClockProps,
      clockOut,
      cancelClock,
      clockOutUnderCursor: this.clockOutUnderCursor,
      clockInUnderCursor: this.clockInUnderCursor,
      cancelClockUnderCursor: this.cancelClockUnderCursor,
    };

    // TODO: move out building context
    const componentContext = new Map([
      [obsidianContext, defaultObsidianContext],
      [editContextKey, { editContext }],
    ]);

    const timeTrackerContext = new Map([
      ...componentContext,
      ...new Map([
        [
          obsidianContext,
          {
            ...defaultObsidianContext,
            initWeeklyView: () =>
              new Notice("Time tracker weekly view is not yet implemented"),
          },
        ],
      ]),
      ...new Map([[editContextKey, { editContext: timeTrackerEditContext }]]),
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(leaf, this.settings, componentContext),
    );

    this.registerView(
      viewTypeTimeTracker,
      (leaf: WorkspaceLeaf) =>
        new TimeTrackerView(leaf, this.settings, timeTrackerContext),
    );

    this.registerView(
      viewTypeWeekly,
      (leaf: WorkspaceLeaf) =>
        new WeeklyView(leaf, this.settings, componentContext),
    );
  }
}
