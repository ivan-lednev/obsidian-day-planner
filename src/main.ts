import { FileView, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { getAPI } from "obsidian-dataview";
import type { SvelteComponentDev } from "svelte/internal";
import { get, Writable } from "svelte/store";

import { viewTypeTimeline, viewTypeWeekly } from "./constants";
import { settings } from "./global-store/settings";
import { visibleDateRange } from "./global-store/visible-date-range";
import { visibleDayInTimeline } from "./global-store/visible-day-in-timeline";
import { DataviewFacade } from "./service/dataview-facade";
import { ObsidianFacade } from "./service/obsidian-facade";
import { PlanEditor } from "./service/plan-editor";
import { DayPlannerSettings, defaultSettings } from "./settings";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { StatusBar } from "./ui/status-bar";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { createDailyNoteIfNeeded, dailyNoteExists } from "./util/daily-notes";
import { getDaysOfCurrentWeek, isToday } from "./util/moment";

export default class DayPlanner extends Plugin {
  settings: () => DayPlannerSettings;
  private settingsStore: Writable<DayPlannerSettings>;
  private statusBar: StatusBar;
  private obsidianFacade: ObsidianFacade;
  private planEditor: PlanEditor;
  private statusBarWidget: SvelteComponentDev;
  private dataviewFacade: DataviewFacade;

  async onload() {
    this.settingsStore = await this.initSettingsStore();
    this.settings = () => get(this.settingsStore);

    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(),
      this.initTimelineLeaf,
    );

    this.registerCommands();

    this.obsidianFacade = new ObsidianFacade(this.app, this.settings);
    this.planEditor = new PlanEditor(this.settings, this.obsidianFacade);
    this.dataviewFacade = new DataviewFacade(getAPI(this.app));

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(
          leaf,
          this.settings,
          this.obsidianFacade,
          this.planEditor,
          this.initWeeklyLeaf,
        ),
    );

    this.registerView(
      viewTypeWeekly,
      (leaf: WorkspaceLeaf) =>
        new WeeklyView(
          leaf,
          this.settings,
          this.obsidianFacade,
          this.planEditor,
        ),
    );

    this.addRibbonIcon("calendar-range", "Timeline", this.initTimelineLeaf);

    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    this.app.workspace.onLayoutReady(this.handleLayoutReady);
    this.app.workspace.on("active-leaf-change", this.handleActiveLeafChanged);
    this.app.metadataCache.on("changed", async (file: TFile) => {
      // todo: be clever about figuring out which days we need to update
      // todo: this is just to trigger UI update
      visibleDateRange.update((prev) => [...prev]);
      visibleDayInTimeline.update((prev) => prev.clone());
    });
    // @ts-ignore
    this.app.metadataCache.on("dataview:metadata-change", () => {
      // todo: remove copy-paste
      console.log(this.dataviewFacade.main());
    });

    this.registerInterval(
      window.setInterval(
        () => this.updateStatusBarOnFailed(this.updateStatusBar),
        5000,
      ),
    );

    // const statusBarItemEl = this.addStatusBarItem();
    // this.statusBarWidget = new StatusBarWidget({
    //   target: statusBarItemEl,
    // });
  }

  private handleActiveLeafChanged = ({ view }: WorkspaceLeaf) => {
    if (!(view instanceof FileView) || !view.file) {
      return;
    }

    const dayUserSwitchedTo = getDateFromFile(view.file, "day");

    if (dayUserSwitchedTo.isSame(get(visibleDayInTimeline), "day")) {
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

    return settings;
  }

  private handleLayoutReady = async () => {
    visibleDateRange.set(getDaysOfCurrentWeek());
  };

  async onunload() {
    await this.detachLeavesOfType(viewTypeTimeline);
    await this.detachLeavesOfType(viewTypeWeekly);
  }

  private async updateStatusBarOnFailed(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (error) {
      this.statusBar.setText(`⚠️ Planner update failed (see console)`);
      console.error(error);
    }
  }

  private updateStatusBar = async () => {
    if (dailyNoteExists()) {
      const note = getDailyNote(window.moment(), getAllDailyNotes());
      const planItems = await this.obsidianFacade.getPlanItemsFromFile(note);
      await this.statusBar.update(planItems);
    } else {
      this.statusBar.setEmpty();
    }
  };

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

  private async detachLeavesOfType(type: string) {
    // Although detatch() is synchronous, without wrapping into a promise, weird things happen:
    // - when re-initializing the weekly view, it gets deleted every other time instead of getting re-created
    // - or the tabs get hidden
    return Promise.all(
      this.app.workspace.getLeavesOfType(type).map((leaf) => leaf.detach()),
    );
  }
}
