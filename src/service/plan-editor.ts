import { difference, groupBy, partition } from "lodash/fp";
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
    const [edited, created] = partition(
      (task) => task.location.line !== undefined,
      dirty,
    );

    if (created.length > 1) {
      throw new Error("Creating more than 1 task is not supported");
    }

    if (edited.length > 0 && created.length > 0) {
      throw new Error(
        "Creating and editing at the same time is not supported and might cause inconsistent behaviors due to race conditions",
      );
    }

    if (created.length > 0) {
      const task = created[0];

      await this.obsidianFacade.editFile(task.location.path, (contents) => {
        return this.writeTaskToFileContents(task, contents);
      });
    }

    const pathToEditedTasksLookup = groupBy(
      (task) => task.location.path,
      edited,
    );

    const editPromises = Object.keys(pathToEditedTasksLookup).map(
      async (path) =>
        await this.obsidianFacade.editFile(path, (contents) =>
          pathToEditedTasksLookup[path].reduce(
            (result, current) => this.updateTaskInFileContents(result, current),
            contents,
          ),
        ),
    );

    await Promise.all(editPromises);
  };

  writeTaskToFileContents(task: PlanItem, contents: string) {
    const metadata =
      this.obsidianFacade.getMetadataForPath(task.location.path) || {};
    const [planEndLine, splitContents] = this.getPlanEndLine(
      contents.split("\n"),
      metadata,
    );

    const result = [...splitContents];

    result.splice(planEndLine + 1, 0, this.taskLineToString(task, { ...task }));

    return result.join("\n");
  }

  createPlannerHeading() {
    const { plannerHeading, plannerHeadingLevel } = this.settings();

    const headingTokens = "#".repeat(plannerHeadingLevel);

    return `${headingTokens} ${plannerHeading}`;
  }

  private updateTaskInFileContents(contents: string, task: PlanItem) {
    return contents
      .split("\n")
      .map((line, index) => {
        // todo: if a task is newly created, it's not going to have a line. We need a clearer way to track this information
        //  once this is done, remove optional chaining
        if (index === task.location?.line) {
          const taskAsString = this.taskLineToString(task, {
            startMinutes: task.startMinutes,
            durationMinutes: task.durationMinutes,
          });

          return (
            line.substring(0, task.location.position.start.col) + taskAsString
          );
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
