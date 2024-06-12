import { groupBy } from "lodash/fp";
import type { CachedMetadata } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";

import { findNodeAtPoint, fromMarkdown, toMarkdown } from "../mdast/mdast";
import {
  attachTaskStartEndTimes,
  reorderListItemByTime,
} from "../mdast/mdast-task";
import { getHeadingByText, getListItemsUnderHeading } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";
import type { PlacedTask, Task } from "../types";
import { createDailyNoteIfNeeded } from "../util/daily-notes";
import { updateTaskText } from "../util/task-utils";

import type { ObsidianFacade } from "./obsidian-facade";

export class PlanEditor {
  constructor(
    private readonly settings: () => DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
  ) {}

  async ensureFilesForTasks(tasks: Task[]) {
    return Promise.all(
      tasks.map(async (task) => {
        if (task.location?.path) {
          return task;
        }

        const { path } = await createDailyNoteIfNeeded(task.startTime);
        return { ...task, location: { path } };
      }),
    );
  }

  // todo: all except this can be re-written to use mdast
  syncTasksWithFile = async ({
    updated,
    created,
    moved,
  }: {
    updated: Task[];
    created: Task[];
    moved: { dayKey: string; task: PlacedTask }[];
  }) => {
    if (created.length > 0) {
      const [task] = await this.ensureFilesForTasks(created);

      return this.obsidianFacade.editFile(task.location.path, (contents) => {
        // @ts-ignore
        return this.writeTaskToFileContents(task, contents, task.location.path);
      });
    }

    if (moved.length > 0) {
      // todo: dayKey is the new date, make files for those
      const [task] = await this.ensureFilesForTasks(
        moved.map(({ task }) => task),
      );

      const noteForFile = getDailyNote(
        window.moment(moved[0].dayKey),
        getAllDailyNotes(),
      );

      const updated = updateTaskText(task as Task);

      return Promise.all([
        this.obsidianFacade.editFile(noteForFile.path, (contents) => {
          // @ts-ignore
          return this.writeTaskToFileContents(
            updated,
            contents,
            noteForFile.path,
          );
        }),
        this.obsidianFacade.editFile(task.location.path, (contents) => {
          // @ts-ignore
          return this.removeTaskFromFileContents(task, contents);
        }),
      ]);
    }

    const pathToEditedTasksLookup = groupBy(
      (task) => task.location.path,
      updated,
    );

    const editPromises = Object.entries(pathToEditedTasksLookup).map(
      async ([path, tasks]) =>
        await this.obsidianFacade.editFile(path, (contents) => {
          const updatedContents = tasks.reduce(
            (result, current) => this.updateTaskInFileContents(result, current),
            contents,
          );

          if (this.settings().reorderTasksAfterMoving) {
            return reorderTasksInFileContents(updatedContents, tasks);
          } else {
            return updatedContents;
          }
        }),
    );

    return Promise.all(editPromises);
  };

  writeTaskToFileContents(task: Task, contents: string, path: string) {
    // todo: we can use dataview
    const metadata = this.obsidianFacade.getMetadataForPath(path) || {};
    const [planEndLine, splitContents] = this.getPlanEndLine(
      contents.split("\n"),
      metadata,
    );

    const result = [...splitContents];

    const newTaskText = [
      task.firstLineText,
      ...task.text.split("\n").slice(1),
    ].join("\n");

    result.splice(planEndLine + 1, 0, newTaskText);

    return result.join("\n");
  }

  removeTaskFromFileContents(task: Task, contents: string) {
    const newContents = contents.split("\n");
    const taskLinesCount = task.text.split("\n").length - 1;
    newContents.splice(task.location.position.start.line, taskLinesCount);

    return newContents.join("\n");
  }

  createPlannerHeading() {
    const { plannerHeading, plannerHeadingLevel } = this.settings();

    const headingTokens = "#".repeat(plannerHeadingLevel);

    return `${headingTokens} ${plannerHeading}`;
  }

  private updateTaskInFileContents(contents: string, task: Task) {
    return contents
      .split("\n")
      .map((line, index) => {
        if (index === task.location?.line) {
          return (
            line.substring(0, task.location.position.start.col) +
            task.firstLineText
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
}

function reorderTasksInFileContents(
  fileContents: string,
  tasks: Task[],
): string {
  const mdastRoot = fromMarkdown(fileContents);
  const parsedLists = new Set<unknown>();

  for (const task of tasks) {
    const list = findNodeAtPoint({
      tree: mdastRoot,
      point: {
        line: task.location.position.start.line + 1,
        column: task.location.position.start.col + 1,
      },
      searchedNodeType: "list",
    });
    if (!parsedLists.has(list)) {
      attachTaskStartEndTimes(list);
      parsedLists.add(list);
    }

    const listItem = findNodeAtPoint({
      tree: list,
      point: {
        line: task.location.position.start.line + 1,
        column: task.location.position.start.col + 1,
      },
      searchedNodeType: "listItem",
    });

    reorderListItemByTime({ list, listItem });
  }

  return toMarkdown(mdastRoot);
}
