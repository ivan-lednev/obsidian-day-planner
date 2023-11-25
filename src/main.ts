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
import { settings } from "./global-store/settings";
import { visibleDayInTimeline } from "./global-store/visible-day-in-timeline";
import CompositeLoader from "./planned-items/loader/composite-loader";
import DailyNotesItemLoader from "./planned-items/loader/daily-notes-item-loader";
import NullLoader from "./planned-items/loader/null-loader";
import { ProfilingWrapper } from "./planned-items/loader/profiling-wrapper";
import ScheduledTasksLoader from "./planned-items/loader/scheduled-tasks-loader";
import { PlannedItem, PlannedItems } from "./planned-items/planned-items";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { isToday } from "./util/moment";

export default class DayPlanner extends Plugin {
  settings: () => DayPlannerSettings;
  private settingsStore: Writable<DayPlannerSettings>;
  private obsidianFacade: ObsidianFacade;
  private planEditor: PlanEditor;
  private readonly dataviewLoaded = writable(false);
  private plannedItems: PlannedItems<PlannedItem>;

  async onload() {
    await this.initSettingsStore();
    this.initPlannedItems();

    this.obsidianFacade = new ObsidianFacade(this.app);
    this.planEditor = new PlanEditor(this.settings, this.obsidianFacade);

    this.registerCommands();

    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    this.registerViews();
    this.app.workspace.on("active-leaf-change", this.handleActiveLeafChanged);
  }

  private initPlannedItems() {
    const dataview = getAPI(this.app);

    let loader = new NullLoader();

    if (dataview) {
      this.dataviewLoaded.set(true);

      loader = new CompositeLoader([
        new ProfilingWrapper(new DailyNotesItemLoader(dataview)),
        new ProfilingWrapper(new ScheduledTasksLoader(dataview)),
      ]);
    }

    this.plannedItems = new PlannedItems(loader, 100);

    const refresh = () => {
      this.plannedItems.refresh();
    };

    const delayRefresh = () => {
      this.plannedItems.delayRefresh();
    };

    this.app.metadataCache.on(
      // @ts-expect-error
      "dataview:metadata-change",
      refresh,
    );

    document.addEventListener("keydown", delayRefresh);

    const source = derived(this.settingsStore, ($settings) => {
      return $settings.dataviewSource;
    });

    source.subscribe(() => {
      refresh();
    });
  }

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

  private async detachLeavesOfType(type: string) {
    // Although this is synchronous, without wrapping into a promise, weird things happen:
    // - when re-initializing the weekly view, it gets deleted every other time instead of getting re-created
    // - or the tabs get hidden
    await this.app.workspace.detachLeavesOfType(type);
  }

  private registerViews() {
    const componentContext = new Map([
      [
        obsidianContext,
        {
          obsidianFacade: this.obsidianFacade,
          initWeeklyView: this.initWeeklyLeaf,
          refreshTasks: () => this.plannedItems.refresh(),
          dataviewLoaded: this.dataviewLoaded,
          renderMarkdown: this.renderMarkdown,
          plannedItems: this.plannedItems,
          planEditor: this.planEditor,
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
