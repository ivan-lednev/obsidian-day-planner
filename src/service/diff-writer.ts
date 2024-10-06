import { groupBy } from "lodash/fp";
import type { Root } from "mdast";
import type { Moment } from "moment";
import type { CachedMetadata } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { isNotVoid } from "typed-assert";

import {
  compareByTimestampInText,
  findHeadingWithChildren,
  fromMarkdown,
  sortListsRecursively,
  toMarkdown,
} from "../mdast/mdast";
import { getHeadingByText, getListItemsUnderHeading } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask, WithTime } from "../task-types";
import { createDailyNoteIfNeeded } from "../util/daily-notes";
import { getFirstLine, updateTaskText } from "../util/task-utils";
import type { Diff } from "../util/tasks-utils";

import type { ObsidianFacade } from "./obsidian-facade";
import type { VaultFacade } from "./vault-facade";

export type WriterDiff = {
  updated: WithTime<LocalTask>[];
  created: WithTime<LocalTask>[];
  moved: { dayKey: string; task: WithTime<LocalTask> }[];
};

interface Range {
  start: {
    line: number;
  };
  end: {
    line: number;
  };
}

interface UpdateBase {
  path: string;
}

interface RangeOperation extends UpdateBase {
  range: Range;
}

interface Deleted extends RangeOperation {
  type: "deleted";
}

interface Updated extends RangeOperation {
  type: "updated";
  contents: string;
}

interface Created extends UpdateBase {
  type: "created";
  contents: string;
  target?: number;
}

interface MdastUpdate extends UpdateBase {
  type: "mdast";
  updateFn: (root: Root) => Root;
}

export type RangeUpdate = Deleted | Updated | Created;
export type Update = RangeUpdate | MdastUpdate;
export type Transaction = ReturnType<typeof createTransaction>;

function sortUpdates(a: RangeUpdate, b: RangeUpdate) {
  const isACreated = a.type === "created";
  const isBCreated = b.type === "created";

  if (isACreated && isBCreated) {
    return 0;
  }

  // todo: test this
  if (isACreated) {
    return 1;
  }

  if (isBCreated) {
    return -1;
  }

  return a.range.start.line - b.range.start.line;
}

function applyRangeUpdate(lines: string[], rangeUpdate: RangeUpdate) {
  const result = lines.slice();

  if (rangeUpdate.type === "created") {
    if (typeof rangeUpdate.target === "number") {
      result.splice(rangeUpdate.target, 0, rangeUpdate.contents);
    }

    return result;
  }

  const startLine = rangeUpdate.range.start.line;
  const endLine = rangeUpdate.range.end.line;
  const count = endLine - startLine;

  if (rangeUpdate.type === "updated") {
    result.splice(startLine, count, rangeUpdate.contents);
  } else if (rangeUpdate.type === "deleted") {
    result.splice(startLine, count);
  }

  return result;
}

export function createTransaction(updates: Update[]) {
  const pathToUpdates = groupBy((entry) => entry.path, updates);

  return Object.entries(pathToUpdates).map(([path, updates]) => ({
    path,
    updateFn: (contents: string) => {
      const lines = contents.split("\n");
      const mdastUpdates = updates.filter(
        (update): update is MdastUpdate => update.type === "mdast",
      );

      const rangeUpdates = updates.filter(
        (update): update is RangeUpdate => update.type !== "mdast",
      );

      const withRangeUpdatesApplied = rangeUpdates
        .toSorted(sortUpdates)
        .toReversed()
        .reduce(applyRangeUpdate, lines)
        .join("\n");

      if (mdastUpdates.length === 0) {
        return withRangeUpdatesApplied;
      }

      const mdastRoot = fromMarkdown(withRangeUpdatesApplied);

      const withMdastUpdatesApplied = mdastUpdates.reduce(
        (result, { updateFn }) => updateFn(result),
        mdastRoot,
      );

      return toMarkdown(withMdastUpdatesApplied);
    },
  }));
}

export class TransactionWriter {
  private readonly history: Array<Record<string, string>> = [];

  constructor(private readonly vaultFacade: VaultFacade) {}

  writeTransaction = async (transaction: Transaction) => {
    const previousState: Record<string, string> = {};

    const editPromises = transaction.map(({ path, updateFn }) => {
      this.vaultFacade.editFile(path, (contents) => {
        previousState[path] = contents;

        return updateFn(contents);
      });
    });

    this.history.push(previousState);

    return Promise.all(editPromises);
  };

  revert = async () => {
    const lastUpdate = this.history.pop();

    if (!lastUpdate) {
      throw new Error("No updates to revert");
    }
  };
}

export class DiffWriter {
  constructor(
    private readonly settings: () => DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
    private readonly vaultFacade: VaultFacade,
  ) {}

  writeDiff = async (props: Diff) => {};

  syncTasksWithFile = async ({ updated, created, moved }: WriterDiff) => {
    if (created.length > 0) {
      const [task] = await this.ensureFilesForTasks(created);

      return this.editFile(task.location.path, (contents) => {
        // @ts-ignore
        return this.writeTaskToFileContents(task, contents, task.location.path);
      });
    }

    if (moved.length > 0) {
      // only one at a time is supported
      const movedTask = moved[0];

      if (movedTask.task.location) {
        await this.editFile(movedTask.task.location.path, (contents) => {
          // @ts-ignore
          return this.removeTaskFromFileContents(movedTask.task, contents);
        });
      }

      const withNewDates = moved.map(({ dayKey, task }) => {
        const parsedDay: Moment = window.moment(dayKey);
        const newStartTime = task.startTime
          .clone()
          .year(parsedDay.year())
          .month(parsedDay.month())
          .date(parsedDay.date());

        return { ...task, startTime: newStartTime };
      });

      const [task] = await this.ensureFilesForTasks(withNewDates);

      const noteForFile = getDailyNote(
        window.moment(task.startTime),
        getAllDailyNotes(),
      );

      const updated = updateTaskText(task as WithTime<LocalTask>);

      return this.editFile(noteForFile.path, (contents) => {
        // @ts-ignore
        return this.writeTaskToFileContents(
          updated,
          contents,
          noteForFile.path,
        );
      });
    }

    const pathToEditedTasksLookup = groupBy(
      (task) => task.location?.path,
      updated,
    );

    const editPromises = Object.keys(pathToEditedTasksLookup).map(
      async (path) =>
        await this.editFile(path, (contents) =>
          pathToEditedTasksLookup[path].reduce(
            (result, current) => this.updateTaskInFileContents(result, current),
            contents,
          ),
        ),
    );

    return Promise.all(editPromises);
  };

  createPlannerHeading() {
    const { plannerHeading, plannerHeadingLevel } = this.settings();

    const headingTokens = "#".repeat(plannerHeadingLevel);

    return `${headingTokens} ${plannerHeading}`;
  }

  // todo: rework to ensure files for dates
  private async ensureFilesForTasks(tasks: WithTime<LocalTask>[]) {
    return Promise.all(
      tasks.map(async (task) => {
        const { path } = await createDailyNoteIfNeeded(task.startTime);

        return { ...task, location: { ...task.location, path } };
      }),
    );
  }

  private writeTaskToFileContents(
    task: WithTime<LocalTask>,
    contents: string,
    path: string,
  ) {
    const metadata = this.obsidianFacade.getMetadataForPath(path) || {};
    const [planEndLine, splitContents] = this.getPlanEndLine(
      contents.split("\n"),
      metadata,
    );

    const result = [...splitContents];

    result.splice(planEndLine + 1, 0, task.text);

    return result.join("\n");
  }

  // todo: use deleteLines
  private removeTaskFromFileContents(
    task: WithTime<LocalTask>,
    contents: string,
  ) {
    const newContents = contents.split("\n");
    const taskLinesCount = task.text.split("\n").length - 1;

    if (task.location?.position) {
      newContents.splice(task.location.position.start.line, taskLinesCount);
    }

    return newContents.join("\n");
  }

  private updateTaskInFileContents(
    contents: string,
    task: WithTime<LocalTask>,
  ) {
    const location = task.location;

    isNotVoid(location);

    const { line, col } = location.position.start;
    const updated = contents.split("\n");

    updated[line] = updated[line].substring(0, col) + getFirstLine(task.text);

    return updated.join("\n");
  }

  private async editFile(path: string, editFn: (contents: string) => string) {
    await this.vaultFacade.editFile(path, (contents) => {
      const edited = editFn(contents);

      if (!this.settings().sortTasksInPlanAfterEdit) {
        return edited;
      }

      const plannerHeading = this.settings().plannerHeading;
      const mdastRoot = fromMarkdown(edited);
      const headingWithChildren = findHeadingWithChildren(
        mdastRoot,
        plannerHeading,
      );

      if (!headingWithChildren) {
        return edited;
      }

      const firstNode = headingWithChildren.children.at(0);
      const lastNode = headingWithChildren.children.at(-1);

      isNotVoid(firstNode?.position?.start?.offset);
      isNotVoid(lastNode?.position?.end?.offset);

      const sorted = {
        ...headingWithChildren,
        children: headingWithChildren.children.map((child) =>
          sortListsRecursively(child, compareByTimestampInText),
        ),
      };

      return (
        edited.substring(0, firstNode.position.start.offset) +
        toMarkdown(sorted) +
        edited.substring(lastNode.position.end.offset + 1)
      );
    });
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

    if (planListItems && planListItems?.length > 0) {
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
