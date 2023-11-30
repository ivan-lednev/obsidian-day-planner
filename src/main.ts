import {
  Component,
  FileView,
  MarkdownRenderer,
  Plugin,
  WorkspaceLeaf,
} from "obsidian";
import { getDateFromFile } from "obsidian-daily-notes-interface";
import { getAPI } from "obsidian-dataview";
import { derived, get, writable, Writable } from "svelte/store";

import { obsidianContext, viewTypeTimeline, viewTypeWeekly } from "./constants";
import { currentTime } from "./global-store/current-time";
import { settings } from "./global-store/settings";
import { visibleDayInTimeline } from "./global-store/visible-day-in-timeline";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { useDebouncedDataviewTasks } from "./ui/hooks/use-debounced-dataview-tasks";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import { useVisibleTasks } from "./ui/hooks/use-visible-tasks";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { isToday } from "./util/moment";
import { getDayKey } from "./util/tasks-utils";

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

    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    this.registerViews();
    this.app.workspace.on("active-leaf-change", this.handleActiveLeafChanged);
  }

  async onunload() {
    await this.detachLeavesOfType(viewTypeTimeline);
    await this.detachLeavesOfType(viewTypeWeekly);
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

  renderMarkdown = (el: HTMLElement, text: string) => {
    const loader = new Component();

    el.empty();

    // todo: investigate why `await` doesn't work as expected here
    MarkdownRenderer.render(this.app, text, el, "", loader);

    loader.load();

    return () => loader.unload();
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
    const dataviewTasks = useDebouncedDataviewTasks({
      metadataCache: this.app.metadataCache,
      getAllTasks: this.getAllTasks,
    });

    const visibleTasks = useVisibleTasks({ dataviewTasks });

    const tasksForToday = derived(
      [visibleTasks, currentTime],
      ([$visibleTasks, $currentTime]) => {
        return $visibleTasks[getDayKey($currentTime)];
      },
    );

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

    new StatusBarWidget({
      target: this.addStatusBarItem(),
      props: {
        onClick: this.initTimelineLeaf,
        tasksForToday,
      },
    });

    const componentContext = new Map([
      [
        obsidianContext,
        {
          obsidianFacade: this.obsidianFacade,
          initWeeklyView: this.initWeeklyLeaf,
          refreshTasks: this.refreshTasks,
          dataviewLoaded: this.dataviewLoaded,
          renderMarkdown: this.renderMarkdown,
          editContext,
          visibleTasks,
        },
      ],
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
