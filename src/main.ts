import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";
import { VIEW_TYPE_TIMELINE } from "./constants";
import { DayPlannerSettings } from "./settings";
import { appStore, getTimelineFile, tasks } from "./store/timeline-store";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { StatusBar } from "./ui/status-bar";
import TimelineView from "./ui/timeline-view";
import { createDailyNoteIfNeeded, dailyNoteExists } from "./util/daily-notes";
import { createPlannerHeading } from "./plan";
import { refreshPlanItemsInStore } from "./util/obsidian";
import { settings } from "./store/settings";

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

    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show the Day Planner Timeline",
      callback: async () => await this.initLeaf(),
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: async () =>
        this.app.workspace
          .getLeaf(false)
          .openFile(await createDailyNoteIfNeeded()),
    });

    this.addCommand({
      id: "insert-planner-heading-at-cursor",
      name: "Insert Planner Heading at Cursor",
      editorCallback: (editor) =>
        editor.replaceSelection(createPlannerHeading()),
    });

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf: WorkspaceLeaf) => new TimelineView(leaf, this.settings, this),
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));

    this.initStore();

    this.app.workspace.onLayoutReady(async () => {
      await refreshPlanItemsInStore();
    });

    this.app.metadataCache.on("changed", async (file: TFile) => {
      if (file === getTimelineFile()) {
        await refreshPlanItemsInStore();
      }
    });

    this.registerInterval(
      window.setInterval(
        () => this.updateStatusBarOnFailed(this.updateStatusBar),
        1000,
      ),
    );
  }

  private initStore() {
    appStore.set(this.app);

    const {
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat,
      plannerHeading,
      plannerHeadingLevel,
    } = this.settings;

    settings.set({
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat,
      plannerHeading,
      plannerHeadingLevel,
    });

    settings.subscribe(async (newValue) => {
      this.settings = { ...this.settings, ...newValue };
      await this.saveData(this.settings);
    });
  }

  onunload() {
    this.detachTimelineLeaves();
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
      await this.statusBar.update(get(tasks));
    } else {
      this.statusBar.setEmpty();
    }
  };

  private async initLeaf() {
    this.detachTimelineLeaves();
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TIMELINE,
      active: true,
    });
  }

  private detachTimelineLeaves() {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_TIMELINE)
      .forEach((leaf) => leaf.detach());
  }
}
