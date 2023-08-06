import type { MarkdownView, Workspace } from "obsidian";
import type DayPlannerFile from "./file";
import { PlanSummaryData } from "./plan/plan-summary-data";
import { DayPlannerSettings, NoteForDateQuery } from "./settings";
import type { PlanItem } from "./plan/plan-item";
import { parsePlanItems } from "./parser/parser";
import type { MetadataCache } from "obsidian";

export default class PlannerMarkdown {
  dayPlannerLastEdit: number;
  noteForDateQuery: NoteForDateQuery;

  constructor(
    private readonly workspace: Workspace,
    private readonly metadataCache: MetadataCache,
    private readonly settings: DayPlannerSettings,
    private readonly file: DayPlannerFile,
  ) {
    this.noteForDateQuery = new NoteForDateQuery();
  }

  async parseDayPlanner(): Promise<PlanSummaryData> {
    const filePath = this.file.getTodayPlannerFilePath();
    const fileContents = await this.file.getPlannerContents(filePath);
    const metadata = this.metadataCache.getFileCache(
      this.metadataCache.getFirstLinkpathDest(filePath, ""),
    );

    return new PlanSummaryData(
      parsePlanItems(fileContents, metadata, this.settings.plannerHeading),
    );
  }

  async updateDayPlannerMarkdown(planSummary: PlanSummaryData) {
    if (this.dayPlannerLastEdit + 6000 > new Date().getTime()) {
      return;
    }
    const filePath = this.file.getTodayPlannerFilePath();
    const fileContents = await this.file.getPlannerContents(filePath);
    const fileContentsArr = fileContents.split("\n");

    planSummary.calculatePlanItemProps();
    if (planSummary.empty) {
      return;
    }
    const results = planSummary.items.map((item) => {
      const result = this.updateItemCompletion(item, item.isPast);
      return { index: item.matchIndex, replacement: result };
    });

    results.forEach((result) => {
      fileContentsArr[result.index] = result.replacement;
    });
  }

  private updateItemCompletion(item: PlanItem, complete: boolean) {
    let check = this.check(complete);
    //Override to use current (user inputted) state if plugin setting is enabled
    if (!this.settings.completePastItems) {
      check = this.check(item.isCompleted);
    }

    let outputTask = `- [${check}] ${item.rawStartTime} `;
    if (item.rawEndTime !== "") {
      outputTask += `- ${item.rawEndTime} `;
    }

    return outputTask + `${item.text}`;
  }

  private check(check: boolean) {
    return check ? "x" : " ";
  }

  checkIsDayPlannerEditing() {
    // TODO: replace deprecated code
    const activeLeaf = this.workspace.activeLeaf;
    if (!activeLeaf) {
      return;
    }
    const viewState = activeLeaf.view.getState();
    if (viewState.file === this.file.getTodayPlannerFilePath()) {
      this.dayPlannerLastEdit = new Date().getTime();
    }
  }
}
