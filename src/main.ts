import { FileView, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { viewTypeTimeline, viewTypeWeekly } from "./constants";
import { appStore } from "./global-stores/app-store";
import { settings } from "./global-stores/settings";
import { visibleDateRange } from "./global-stores/visible-date-range";
import { visibleDayInTimeline } from "./global-stores/visible-day-in-timeline";
import { DayPlannerSettings } from "./settings";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { StatusBar } from "./ui/status-bar";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import { createDailyNoteIfNeeded, dailyNoteExists } from "./util/daily-notes";
import { getDaysOfCurrentWeek, isToday } from "./util/moment";
import { ObsidianFacade } from "./util/obsidian-facade";
import { PlanEditor } from "./util/plan-editor";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  private statusBar: StatusBar;
  private obsidianFacade: ObsidianFacade;
  private planEditor: PlanEditor;

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

    this.obsidianFacade = new ObsidianFacade(
      this.app.workspace,
      this.app.vault,
      this.app.metadataCache,
      this.settings,
    );

    this.planEditor = new PlanEditor(
      this.settings,
      this.app.metadataCache,
      this.obsidianFacade,
    );

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(leaf, this.settings, this.obsidianFacade),
    );

    this.registerView(
      viewTypeWeekly,
      (leaf: WorkspaceLeaf) =>
        new WeeklyView(leaf, this.settings, this.obsidianFacade),
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
        editor.replaceSelection(this.planEditor.createPlannerHeading()),
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
    this.detachLeavesOfType(viewTypeTimeline);
    this.detachLeavesOfType(viewTypeWeekly);
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

  private async initWeeklyLeaf() {
    this.detachLeavesOfType(viewTypeWeekly);
    await this.app.workspace.getLeaf(false).setViewState({
      type: viewTypeWeekly,
      active: true,
    });
  }

  private async initTimelineLeaf() {
    this.detachLeavesOfType(viewTypeTimeline);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: viewTypeTimeline,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  }

  private detachLeavesOfType(type: string) {
    this.app.workspace.getLeavesOfType(type).forEach((leaf) => leaf.detach());
  }
}
