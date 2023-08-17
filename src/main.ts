import { Plugin, TFile, Vault, WorkspaceLeaf } from "obsidian";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { DayPlannerSettings } from "./settings";
import { VIEW_TYPE_TIMELINE } from "./constants";
import TimelineView from "./ui/timeline-view";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { parsePlanItems } from "./parser/parser";
import {
  createDailyNoteIfNeeded,
  dailyNoteExists,
  getDailyNoteForToday,
} from "./util/daily-notes";
import { StatusBar } from "./ui/status-bar";
import { tasks } from "./store/timeline-store";
import { get } from "svelte/store";
import { createPlannerHeading } from "./create-plan";

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

    this.app.workspace.onLayoutReady(async () => {
      await this.refreshPlanItemsInStore();
    });

    this.app.metadataCache.on("changed", async (file: TFile) => {
      if (file === getDailyNoteForToday()) {
        await this.refreshPlanItemsInStore();
      }
    });

    this.registerInterval(
      window.setInterval(
        () => this.updateStatusBarOnFailed(this.updateStatusBar),
        1000,
      ),
    );
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

  private async refreshPlanItemsInStore() {
    const parsedPlanItems = await this.getPlanItems();

    tasks.update(() => parsedPlanItems);
  }

  private updateStatusBar = async () => {
    if (dailyNoteExists()) {
      await this.statusBar.update(get(tasks));
    } else {
      this.statusBar.setEmpty();
    }
  };

  private async getPlanItems() {
    const dailyNote = getDailyNote(window.moment(), getAllDailyNotes());

    if (!dailyNote) {
      return [];
    }

    const fileContents = await this.app.vault.cachedRead(dailyNote);
    const metadata = this.app.metadataCache.getFileCache(dailyNote);

    return parsePlanItems(
      fileContents,
      metadata,
      this.settings.plannerHeading,
      dailyNote.path,
    );
  }

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
