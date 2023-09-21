import { difference, partition } from "lodash/fp";
import type { Moment } from "moment";
import type { CachedMetadata } from "obsidian";

import { getHeadingByText, getListItemsUnderHeading } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";
import type { PlanItem, Timestamp } from "../types";
import { addMinutes, minutesToMoment } from "../util/moment";
import { isEqualTask } from "../util/task-utils";

import type { ObsidianFacade } from "./obsidian-facade";

export class PlanEditor {
  constructor(
    private readonly settings: () => DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
  ) {}

  syncTasksWithFile = async (baseline: PlanItem[], updated: PlanItem[]) => {
    const pristine = updated.filter((task) =>
      baseline.find((baselineTask) => isEqualTask(task, baselineTask)),
    );

    const dirty = difference(updated, pristine);
    const [edited, created] = partition((task) => task.location.line, dirty);
    const path = updated[0].location.path;

    await this.obsidianFacade.editFile(path, (contents) => {
      const withUpdatedEdited = edited.reduce(
        (result, current) => this.updateTaskInFileContents(result, current),
        contents,
      );

      const createdList = created.map((task) =>
        this.taskLineToString(task, { ...task }),
      );
      const metadata = this.obsidianFacade.getMetadataForPath(path) || {};
      const [planEndLine, splitContents] = this.getPlanEndLine(
        withUpdatedEdited.split("\n"),
        metadata,
      );

      const result = [...splitContents];
      result.splice(planEndLine + 1, 0, ...createdList);
      return result.join("\n");
    });
  };

  createPlannerHeading() {
    const { plannerHeading, plannerHeadingLevel } = this.settings();

    const headingTokens = "#".repeat(plannerHeadingLevel);

    return `${headingTokens} ${plannerHeading}`;
  }

  // todo: we might want to update not only duration. Better: syncTaskWithNote
  private updateTaskInFileContents(contents: string, task: PlanItem) {
    return contents
      .split("\n")
      .map((line, index) => {
        // todo: if a task is newly created, it's not going to have a line. We need a clearer way to track this information
        if (index === task.location?.line) {
          return this.taskLineToString(task, {
            startMinutes: task.startMinutes,
            durationMinutes: task.durationMinutes,
          });
        }

        return line;
      })
      .join("\n");
  }

  private getPlanEndLine(
    contents: string[],
    metadata: CachedMetadata,
  ): [number, string[]] {
    const planHeading = getHeadingByText(
      metadata,
      this.settings().plannerHeading,
    );

    const planListItems = getListItemsUnderHeading(
      metadata,
      this.settings().plannerHeading,
    );

    if (planListItems?.length > 0) {
      const lastListItem = planListItems[planListItems.length - 1];

      return [lastListItem.position.start.line, contents];
    }

    if (planHeading) {
      return [planHeading.position.start.line, contents];
    }

    const withNewPlan = [...contents, "", this.createPlannerHeading(), ""];

    return [withNewPlan.length, withNewPlan];
  }

  private taskLineToString(
    planItem: PlanItem,
    { startMinutes, durationMinutes }: Timestamp,
  ) {
    return `${planItem.listTokens}${this.createTimestamp(
      startMinutes,
      durationMinutes,
    )} ${planItem.firstLineText}`;
  }

  private createTimestamp(startMinutes: number, durationMinutes: number) {
    const start = minutesToMoment(startMinutes);
    const end = addMinutes(start, durationMinutes);

    return `${this.formatTimestamp(start)} - ${this.formatTimestamp(end)}`;
  }

  private formatTimestamp(moment: Moment) {
    return moment.format(this.settings().timestampFormat);
  }
}
