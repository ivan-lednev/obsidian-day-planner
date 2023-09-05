import { FileView, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { VIEW_TYPE_TIMELINE, VIEW_TYPE_WEEKLY } from "./constants";
import { createPlannerHeading } from "./plan";
import { DayPlannerSettings } from "./settings";
import { appStore } from "./store/app-store";
import { settings } from "./store/settings";
import { visibleDateRange } from "./store/visible-date-range";
import { visibleDayInTimeline } from "./store/visible-day-in-timeline";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { StatusBar } from "./ui/status-bar";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { createDailyNoteIfNeeded, dailyNoteExists } from "./util/daily-notes";
import { getDaysOfCurrentWeek, isToday } from "./util/moment";
import { getPlanItemsFromFile } from "./util/obsidian";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  private statusBar: StatusBar;

  async onload() {
    this.settings = Object.assign(
      new DayPlannerSettings(),
      await this.loadData(),
    );

    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(),
      this.app.workspace,
    );

    this.registerCommands();

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf: WorkspaceLeaf) => new TimelineView(leaf, this.settings, this),
    );

    this.registerView(
      VIEW_TYPE_WEEKLY,
      (leaf: WorkspaceLeaf) => new WeeklyView(leaf, this),
    );

    this.addRibbonIcon(
      "calendar-range",
      "Week plan",
      async () => await this.initWeeklyLeaf(),
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.initAppAndSettingsStores();

    this.app.workspace.onLayoutReady(this.handleLayoutReady);
    this.app.workspace.on("active-leaf-change", this.handleActiveLeafChanged);
    this.app.metadataCache.on("changed", async (file: TFile) => {
      // todo: be clever about figuring out which days we need to update
      // todo: this is just to trigger UI update
      visibleDateRange.update((prev) => [...prev]);
      visibleDayInTimeline.update((prev) => prev.clone());
    });

    this.registerInterval(
      window.setInterval(
        () => this.updateStatusBarOnFailed(this.updateStatusBar),
        5000,
      ),
    );
  }

  private handleActiveLeafChanged = ({ view }: WorkspaceLeaf) => {
    if (!(view instanceof FileView) || !view.file) {
      return;
    }

    const newDay = getDateFromFile(view.file, "day");

    if (!newDay) {
      if (isToday(get(visibleDayInTimeline))) {
        visibleDayInTimeline.set(window.moment());
      }

      return;
    }

    visibleDayInTimeline.set(newDay);
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
      callback: async () => await this.initWeeklyLeaf(),
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
        editor.replaceSelection(createPlannerHeading()),
    });
  }

  private initAppAndSettingsStores() {
    appStore.set(this.app);

    const {
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat,
      plannerHeading,
      plannerHeadingLevel,
      timelineColored,
      timelineStartColor,
      timelineEndColor,
    } = this.settings;

    settings.set({
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat,
      plannerHeading,
      plannerHeadingLevel,
      timelineColored,
      timelineStartColor,
      timelineEndColor,
    });

    settings.subscribe(async (newValue) => {
      this.settings = { ...this.settings, ...newValue };
      await this.saveData(this.settings);
    });
  }

  private handleLayoutReady = async () => {
    visibleDateRange.set(getDaysOfCurrentWeek());
  };

  onunload() {
    this.detachLeavesOfType(VIEW_TYPE_TIMELINE);
    this.detachLeavesOfType(VIEW_TYPE_WEEKLY);
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
      const planItems = await getPlanItemsFromFile(note);
      await this.statusBar.update(planItems);
    } else {
      this.statusBar.setEmpty();
    }
  };

  private async initWeeklyLeaf() {
    this.detachLeavesOfType(VIEW_TYPE_WEEKLY);
    await this.app.workspace.getLeaf(false).setViewState({
      type: VIEW_TYPE_WEEKLY,
      active: true,
    });
  }

  private async initTimelineLeaf() {
    this.detachLeavesOfType(VIEW_TYPE_TIMELINE);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TIMELINE,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  }

  private detachLeavesOfType(type: string) {
    this.app.workspace.getLeavesOfType(type).forEach((leaf) => leaf.detach());
  }
}
