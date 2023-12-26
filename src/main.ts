import { flow, noop } from "lodash/fp";
import { Moment } from "moment";
import { FileView, Loc, MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import { getDateFromFile } from "obsidian-daily-notes-interface";
import { DataArray, getAPI, STask } from "obsidian-dataview";
import { derived, get, Readable, Writable, writable } from "svelte/store";

import {
  editContextKey,
  obsidianContext,
  viewTypeTimeline,
  viewTypeTimeTracker,
  viewTypeWeekly,
} from "./constants";
import { currentTime } from "./global-store/current-time";
import { settings } from "./global-store/settings";
import { visibleDayInTimeline } from "./global-store/visible-day-in-timeline";
import { replaceSTaskInFile, toMarkdown } from "./service/dataview-facade";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { useActiveClocks } from "./ui/hooks/use-active-clocks";
import { useDayToStasksLookup } from "./ui/hooks/use-day-to-stasks-lookup";
import { useDebouncedDataviewTasks } from "./ui/hooks/use-debounced-dataview-tasks";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import { useVisibleClockRecords } from "./ui/hooks/use-visible-clock-records";
import { useVisibleTasks } from "./ui/hooks/use-visible-tasks";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimeTrackerView from "./ui/time-tracker-view";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import {
  hasActiveClock,
  withActiveClock,
  withActiveClockCompleted,
  withoutActiveClock,
} from "./util/clock";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { isToday } from "./util/moment";
import { getDayKey } from "./util/tasks-utils";
import { withNotice } from "./util/with-notice";

export default class DayPlanner extends Plugin {
  settings: () => DayPlannerSettings;
  private settingsStore: Writable<DayPlannerSettings>;
  private obsidianFacade: ObsidianFacade;
  private planEditor: PlanEditor;
  private readonly dataviewLoaded = writable(false);

  async onload() {
    await this.initSettingsStore();

    this.obsidianFacade = new ObsidianFacade(this.app);
    this.planEditor = new PlanEditor(this.settings, this.obsidianFacade);

    this.registerCommands();
    this.registerViews();
    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    this.app.workspace.on("active-leaf-change", this.handleActiveLeafChanged);

    // todo: check for memory leaks after plugin unloads
    this.app.workspace.on("editor-menu", (menu, editor, view) => {
      // TODO: get task under cursor
      // TODO: add items only if relevant

      menu.addItem((item) => {
        item
          .setTitle("Clock in")
          .setIcon("play")
          .onClick(() => {
            console.log("Click!");
          });
      });

      menu.addItem((item) => {
        item
          .setTitle("Clock out")
          .setIcon("square")
          .onClick(() => {
            console.log("Click!");
          });
      });

      menu.addItem((item) => {
        item
          .setTitle("Cancel clock")
          .setIcon("trash")
          .onClick(() => {
            console.log("Click!");
          });
      });
    });
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

  getAllTasks = () => {
    const source = this.settings().dataviewSource;
    return this.refreshTasks(source);
  };

  private refreshTasks = (source: string) => {
    const dataview = getAPI(this.app);

    if (!dataview) {
      return [];
    }

    this.dataviewLoaded.set(true);

    performance.mark("query-start");
    const result = dataview.pages(source).file.tasks;
    performance.mark("query-end");

    const measure = performance.measure(
      "query-time",
      "query-start",
      "query-end",
    );

    console.debug(
      `obsidian-day-planner:
  source: "${source}"
  took: ${measure.duration} ms`,
    );

    return result;
  };

  private handleActiveLeafChanged = ({ view }: WorkspaceLeaf) => {
    if (!(view instanceof FileView) || !view.file) {
      return;
    }

    const dayUserSwitchedTo = getDateFromFile(view.file, "day");

    if (dayUserSwitchedTo?.isSame(get(visibleDayInTimeline), "day")) {
      return;
    }

    if (!dayUserSwitchedTo) {
      if (isToday(get(visibleDayInTimeline))) {
        visibleDayInTimeline.set(window.moment());
      }

      return;
    }

    visibleDayInTimeline.set(dayUserSwitchedTo);
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

  private registerViews() {
    const dataviewTasks: Readable<DataArray<STask>> = useDebouncedDataviewTasks(
      {
        metadataCache: this.app.metadataCache,
        getAllTasks: this.getAllTasks,
      },
    );
    const dayToSTasksLookup = useDayToStasksLookup({ dataviewTasks });
    const visibleTasks = useVisibleTasks({ dayToSTasksLookup });
    const tasksForToday = derived(
      [visibleTasks, currentTime],
      ([$visibleTasks, $currentTime]) => {
        return $visibleTasks[getDayKey($currentTime)];
      },
    );
    const activeClocks = useActiveClocks({ dataviewTasks });
    const visibleClockRecords = useVisibleClockRecords({ dayToSTasksLookup });

    // todo: think of a way to unwrap the hook from the derived store
    const editContext = derived(
      [this.settingsStore, visibleTasks],
      ([$settings, $visibleTasks]) => {
        return useEditContext({
          obsidianFacade: this.obsidianFacade,
          onUpdate: this.planEditor.syncTasksWithFile,
          settings: $settings,
          visibleTasks: $visibleTasks,
        });
      },
    );

    const timeTrackerEditContext = derived(
      [this.settingsStore, visibleClockRecords],
      ([$settings, $visibleClockRecords]) => {
        const base = useEditContext({
          obsidianFacade: this.obsidianFacade,
          onUpdate: this.planEditor.syncTasksWithFile,
          settings: $settings,
          visibleTasks: $visibleClockRecords,
        });

        function disableEditHandlers(day: Moment) {
          return {
            ...base.getEditHandlers(day),
            handleGripMouseDown: noop,
            handleContainerMouseDown: noop,
            handleResizerMouseDown: noop,
          };
        }

        return {
          ...base,
          getEditHandlers: disableEditHandlers,
        };
      },
    );

    // TODO: move out
    // todo: split dataview/editor/workspace

    function locToEditorPosition({ line, col }: Loc) {
      return { line, ch: col };
    }

    const dataview = getAPI(this.app);

    const getTaskUnderCursor = () => {
      const view = this.app.workspace.getMostRecentLeaf()?.view;

      if (view instanceof MarkdownView) {
        const cursor = view.editor.getCursor();

        // todo: hide dataview api
        const sTask = dataview
          .page(view.file.path)
          ?.file?.tasks?.find((sTask: STask) => sTask.line === cursor.line);

        if (!sTask) {
          throw new Error("There is no task under cursor");
        }

        return sTask;
      }
    };

    // todo: remove duplication
    const replaceTaskUnderCursor = (newMarkdown: string) => {
      const view = this.app.workspace.getMostRecentLeaf()?.view;

      if (view instanceof MarkdownView) {
        const cursor = view.editor.getCursor();

        // todo: hide dataview api
        const sTask = dataview
          .page(view.file.path)
          ?.file?.tasks?.find((sTask: STask) => sTask.line === cursor.line);

        if (!sTask) {
          throw new Error("There is no task under cursor");
        }

        view.editor.replaceRange(
          newMarkdown,
          locToEditorPosition(sTask.position.start),
          locToEditorPosition(sTask.position.end),
        );
      }
    };

    const assertActiveClock = (sTask: STask) => {
      if (!hasActiveClock(sTask)) {
        throw new Error("The task has no active clocks");
      }

      return sTask;
    };

    const assertNoActiveClock = (sTask: STask) => {
      if (hasActiveClock(sTask)) {
        throw new Error("The task already has an active clock");
      }

      return sTask;
    };

    const clockInUnderCursor = withNotice(
      flow(
        getTaskUnderCursor,
        assertNoActiveClock,
        withActiveClock,
        toMarkdown,
        replaceTaskUnderCursor,
      ),
    );

    const clockOutUnderCursor = withNotice(
      flow(
        getTaskUnderCursor,
        assertActiveClock,
        withActiveClockCompleted,
        toMarkdown,
        replaceTaskUnderCursor,
      ),
    );

    const cancelClockUnderCursor = withNotice(
      flow(
        getTaskUnderCursor,
        assertActiveClock,
        withoutActiveClock,
        toMarkdown,
        replaceTaskUnderCursor,
      ),
    );

    // todo: out of place
    this.addCommand({
      id: "clock-into-task-under-cursor",
      name: "Clock into task under cursor",
      callback: clockInUnderCursor,
    });

    this.addCommand({
      id: "clock-out-of-task-under-cursor",
      name: "Clock out of task under cursor",
      callback: clockOutUnderCursor,
    });

    this.addCommand({
      id: "cancel-clock-under-cursor",
      name: "Cancel clock on task under cursor",
      callback: clockOutUnderCursor,
    });

    const clockOut = withNotice(async (sTask?: STask) => {
      await this.obsidianFacade.editFile(sTask.path, (contents) =>
        replaceSTaskInFile(
          contents,
          sTask,
          toMarkdown(withActiveClockCompleted(sTask)),
        ),
      );
    });

    const cancelClock = withNotice(async (sTask?: STask) => {
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

    // TODO: move out building context
    const componentContext = new Map([
      [
        obsidianContext,
        {
          obsidianFacade: this.obsidianFacade,
          initWeeklyView: this.initWeeklyLeaf,
          refreshTasks: this.refreshTasks,
          dataviewLoaded: this.dataviewLoaded,
          renderMarkdown: createRenderMarkdown(this.app),
          editContext,
          visibleTasks,
          activeClocks,
          clockOut,
          cancelClock,
          clockOutUnderCursor,
          clockInUnderCursor,
          cancelClockUnderCursor,
        },
      ],
      [editContextKey, { editContext }],
    ]);

    const timeTrackerContext = new Map([
      ...componentContext,
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
