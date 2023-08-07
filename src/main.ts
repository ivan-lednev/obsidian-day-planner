import { Plugin, Vault, WorkspaceLeaf } from "obsidian";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { DayPlannerSettings } from "./settings";
import { VIEW_TYPE_TIMELINE } from "./constants";
import TimelineView from "./ui/timeline-view";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { parsePlanItems } from "./parser/parser";
import { createDailyNoteIfNeeded, dailyNoteExists } from "./util/daily-notes";
import { StatusBar } from "./ui/status-bar";
import { tasks } from "./store/timeline-store";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  private vault: Vault;
  private statusBar: StatusBar;

  async onload() {
    this.vault = this.app.vault;
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
        editor.replaceSelection(this.createPlannerHeading()),
    });

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf: WorkspaceLeaf) => new TimelineView(leaf, this.settings, this),
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));

    this.registerInterval(
      window.setInterval(
        () => this.updateStatusBarOnFailed(this.updateUI),
        2000,
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

  private updateUI = async () => {
    if (dailyNoteExists()) {
      const planItems = await this.getPlanItems();

      await this.statusBar.update(planItems);

      tasks.update(() => planItems);
    } else {
      this.statusBar.setEmpty();
    }
  };

  private async getPlanItems() {
    const dailyNote = getDailyNote(window.moment(), getAllDailyNotes());
    const fileContents = await this.app.vault.cachedRead(dailyNote);
    const metadata = this.app.metadataCache.getFileCache(dailyNote);

    return parsePlanItems(fileContents, metadata, this.settings.plannerHeading);
  }

  private createPlannerHeading() {
    const headingTokens = "#".repeat(this.settings.plannerHeadingLevel);

    return `${headingTokens} ${this.settings.plannerHeading}

- 
`;
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
