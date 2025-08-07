import { groupBy } from "lodash/fp";
import type { Root } from "mdast";
import { isNotVoid } from "typed-assert";

import {
  checkListItem,
  findFirst,
  fromMarkdown,
  insertListItemUnderHeading,
  isListItem,
  toMarkdown,
} from "../mdast/mdast";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask } from "../task-types";
import { EditMode } from "../ui/hooks/use-edit/types";
import { applyScopedUpdates, getFirstLine } from "../util/markdown";
import * as t from "../util/task-utils";

import type { PeriodicNotes } from "./periodic-notes";
import type { VaultFacade } from "./vault-facade";

interface Range {
  start: {
    line: number;
    col: number;
  };
  end: {
    line: number;
    col: number;
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

export interface Updated extends RangeOperation {
  type: "updated";
  contents: string;
}

export interface Created extends UpdateBase {
  type: "created";
  contents: string;
  target: number;
}

interface MdastUpdate extends UpdateBase {
  type: "mdast";
  updateFn: (root: Root) => Root;
}

export type RangeUpdate = Deleted | Updated | Created;
export type Update = RangeUpdate | MdastUpdate;
export type Transaction = ReturnType<typeof createTransaction>;

function sortRangeUpdates(a: RangeUpdate, b: RangeUpdate) {
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
    result.splice(rangeUpdate.target, 0, rangeUpdate.contents);

    return result;
  }

  const startLine = rangeUpdate.range.start.line;
  const startCol = rangeUpdate.range.start.col;
  const endLine = rangeUpdate.range.end.line;
  const count = endLine - startLine + 1;

  if (rangeUpdate.type === "updated") {
    const indentation = result[startLine].substring(0, startCol);
    const updatedLine = indentation + rangeUpdate.contents;

    // todo: use Array.prototype.with
    result.splice(startLine, 1, updatedLine);
  } else if (rangeUpdate.type === "deleted") {
    result.splice(startLine, count);
  }

  return result;
}

export function createTransaction(props: {
  updates: Update[];
  settings: DayPlannerSettings;
  afterEach?: (contents: string) => string;
}) {
  const { updates, afterEach, settings } = props;
  const pathToUpdates = groupBy((entry) => entry.path, updates);

  return Object.entries(pathToUpdates).map(([path, updates]) => ({
    path,
    updateFn: (contents: string) => {
      const lines = contents.split("\n");
      const mdastUpdates = updates.filter<MdastUpdate>(
        (update) => update.type === "mdast",
      );

      const rangeUpdates = updates.filter<RangeUpdate>(
        (update) => update.type !== "mdast",
      );

      let result = rangeUpdates
        .toSorted(sortRangeUpdates)
        .toReversed()
        .reduce(applyRangeUpdate, lines)
        .join("\n");

      // TODO: the knowledge is implicit here: mdast updates are only applied to daily notes
      if (mdastUpdates.length > 0) {
        result = applyScopedUpdates(
          result,
          settings.plannerHeading,
          (contents) => applyMdastUpdates(contents, mdastUpdates),
          { createHeading: true, settings },
        );
      }

      return afterEach ? afterEach(result) : result;
    },
  }));
}

function applyMdastUpdates(text: string, updates: MdastUpdate[]) {
  const mdastRoot = fromMarkdown(text);

  const withMdastUpdatesApplied = updates.reduce(
    (result, { updateFn }) => updateFn(result),
    mdastRoot,
  );

  return toMarkdown(withMdastUpdatesApplied);
}

export class TransactionWriter {
  private readonly history: Array<Record<string, string>> = [];

  constructor(private readonly vaultFacade: VaultFacade) {}

  writeTransaction = async (transaction: Transaction) => {
    const previousState: Record<string, string> = {};

    const editPromises = transaction.map(({ path, updateFn }) =>
      this.vaultFacade.editFile(path, (contents) => {
        previousState[path] = contents;

        return updateFn(contents);
      }),
    );

    this.history.push(previousState);

    return Promise.all(editPromises);
  };

  undo = async () => {
    const lastUpdate = this.history.pop();

    if (!lastUpdate) {
      throw new Error("No updates to revert");
    }

    const editPromises = Object.entries(lastUpdate).map(([path, contents]) =>
      this.vaultFacade.editFile(path, () => contents),
    );

    return Promise.all(editPromises);
  };
}

/**
 * Describes what changed visually in a view after an edit.
 */
export type ViewDiff = {
  deleted?: Array<LocalTask>;
  updated?: Array<LocalTask>;
  added?: Array<LocalTask>;
};

export function getTaskDiffFromEditState(base: LocalTask[], next: LocalTask[]) {
  return next.reduce<Omit<Required<ViewDiff>, "deleted">>(
    (result, task) => {
      const thisTaskInBase = base.find((baseTask) => baseTask.id === task.id);

      if (!thisTaskInBase) {
        result.added.push(task);
      }

      if (thisTaskInBase && !t.isTimeEqual(thisTaskInBase, task)) {
        result.updated.push(task);
      }

      return result;
    },
    {
      updated: [],
      added: [],
    },
  );
}

function mapTaskDiffToUpdate(props: {
  type: string;
  task: LocalTask;
  mode: EditMode;
  settings: DayPlannerSettings;
  periodicNotes: PeriodicNotes;
}): Update | Update[] {
  const { type, task, mode, settings, periodicNotes } = props;
  const taskTextWithUpdatedProps = t.toString(task, mode);

  if (type === "added") {
    if (task.location) {
      if (mode === EditMode.SCHEDULE_SEARCH_RESULT) {
        return {
          type: "updated",
          path: task.location.path,
          range: {
            start: task.location.position.start,
            end: task.location.position.start,
          },
          contents: getFirstLine(taskTextWithUpdatedProps),
        };
      }

      return {
        type: "created",
        contents: taskTextWithUpdatedProps,
        path: task.location.path,
        target: task.location.position?.start?.line,
      };
    }

    return {
      type: "mdast",
      path: periodicNotes.createDailyNotePath(task.startTime),
      updateFn: (root: Root) => {
        const taskRoot = fromMarkdown(taskTextWithUpdatedProps);
        const listItemToInsert = findFirst(taskRoot, checkListItem);

        isNotVoid(listItemToInsert);
        isListItem(listItemToInsert);

        return insertListItemUnderHeading(
          root,
          settings.plannerHeading,
          listItemToInsert,
        );
      },
    };
  }

  isNotVoid(task.location);

  const { path } = task.location;
  const firstLine = task.location.position.start.line;
  const lineSpan = taskTextWithUpdatedProps.split("\n").length - 1;
  const lastLine = firstLine + lineSpan;

  const position = {
    start: task.location.position.start,
    end: { line: lastLine, col: 0 },
  };

  if (type === "deleted") {
    return {
      type: "deleted",
      path,
      range: position,
    };
  }

  const originalLocationDay = periodicNotes.getDateFromPath(path, "day");
  const needToMoveBetweenNotes =
    originalLocationDay && !task.startTime.isSame(originalLocationDay, "day");

  if (!needToMoveBetweenNotes) {
    return {
      type: "updated",
      path,
      range: { start: position.start, end: position.start },
      contents: getFirstLine(taskTextWithUpdatedProps),
    };
  }

  return [
    {
      type: "deleted",
      path,
      range: position,
    },
    {
      type: "mdast",
      path: periodicNotes.createDailyNotePath(task.startTime),
      updateFn: (root: Root) => {
        const taskRoot = fromMarkdown(taskTextWithUpdatedProps);
        const listItemToInsert = findFirst(taskRoot, checkListItem);

        isNotVoid(listItemToInsert);
        isListItem(listItemToInsert);

        return insertListItemUnderHeading(
          root,
          settings.plannerHeading,
          listItemToInsert,
        );
      },
    },
  ];
}

/**
 * Turns the changes to a view into a list of updates that can be applied to the vault.
 */
export function mapTaskDiffToUpdates(
  diff: ViewDiff,
  mode: EditMode,
  settings: DayPlannerSettings,
  periodicNotes: PeriodicNotes,
): Update[] {
  return Object.entries(diff)
    .flatMap(([type, tasks]) => tasks.map((task) => ({ type, task })))
    .reduce<Update[]>((result, { type, task }) => {
      const updates = mapTaskDiffToUpdate({
        type,
        task,
        mode,
        settings,
        periodicNotes,
      });

      return result.concat(updates);
    }, []);
}
