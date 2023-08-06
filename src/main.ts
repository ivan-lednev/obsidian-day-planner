import { Plugin, TAbstractFile, Vault, WorkspaceLeaf } from "obsidian";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { DayPlannerSettings, NoteForDateQuery } from "./settings";
import StatusBar from "./ui/status-bar";
import Progress from "./progress";
import PlannerMarkdown from "./planner-markdown";
import DayPlannerFile from "./file";
import { VIEW_TYPE_TIMELINE } from "./constants";
import TimelineView from "./ui/timeline-view";
import { PlanSummaryData } from "./plan/plan-summary-data";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  vault: Vault;
  file: DayPlannerFile;
  plannerMD: PlannerMarkdown;
  statusBar: StatusBar;
  notesForDatesQuery: NoteForDateQuery;

  async onload() {
    this.vault = this.app.vault;
    this.settings = Object.assign(
      new DayPlannerSettings(),
      await this.loadData(),
    );
    this.notesForDatesQuery = new NoteForDateQuery();
    this.file = new DayPlannerFile(this.vault, this.settings);
    const progress = new Progress();
    this.plannerMD = new PlannerMarkdown(
      this.app.workspace,
      this.app.metadataCache,
      this.settings,
      this.file,
    );
    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(),
      this.app.workspace,
      progress,
      new PlannerMarkdown(
        this.app.workspace,
        this.app.metadataCache,
        this.settings,
        this.file,
      ),
      this.file,
    );

    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show the Day Planner Timeline",
      callback: async () => await this.initLeaf(),
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: () =>
        this.app.workspace.openLinkText(
          this.file.getTodayPlannerFilePath(),
          "",
          true,
        ),
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
      window.setInterval(async () => {
        if (await this.file.hasTodayNote()) {
          const planSummary = await this.plannerMD.parseDayPlanner();
          planSummary.calculatePlanItemProps();
          await this.plannerMD.updateDayPlannerMarkdown(planSummary);
          await this.statusBar.refreshStatusBar(planSummary);

          this.updateTimelineView(planSummary);
        }
      }, 2000),
    );
  }

  private updateTimelineView(planSummary: PlanSummaryData) {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_TIMELINE)
      .forEach(({ view }) => {
        if (view instanceof TimelineView) {
          view.update(planSummary);
        }
      });
  }

  private createPlannerHeading() {
    const headingTokens = "#".repeat(this.settings.plannerHeadingLevel);

    return `${headingTokens} ${this.settings.plannerHeading}

- 
`;
  }

  private async initLeaf() {
    this.detachTimelineLeaves()
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

  onunload() {
    this.detachTimelineLeaves()
  }
}
