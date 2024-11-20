import { groupBy } from "lodash/fp";
import type { Root } from "mdast";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { isNotVoid } from "typed-assert";

import {
  checkListItem,
  findFirst,
  fromMarkdown,
  insertListItemUnderHeading,
  isListItem,
  toMarkdown,
} from "../mdast/mdast";
import { headingRegExp } from "../regexp";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask } from "../task-types";
import { EditMode } from "../ui/hooks/use-edit/types";
import { createDailyNotePath } from "../util/daily-notes";
import * as t from "../util/task-utils";
import { createHeading } from "../util/util";

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

interface Updated extends RangeOperation {
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
      const mdastUpdates = updates.filter(
        (update): update is MdastUpdate => update.type === "mdast",
      );

      const rangeUpdates = updates.filter(
        (update): update is RangeUpdate => update.type !== "mdast",
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

// todo: move to markdown
function appendHeading(contents: string, heading: string) {
  let result = contents;

  if (contents.length > 0) {
    result = result.trimEnd();
    result = result.concat("\n", "\n");
  }

  return result.concat(heading, "\n", "\n");
}

/**
 * We need to limit our updatess to the scope of the heading because mdast-util-to-markdown breaks invalid markdown that we see in user templates.
 */
export function applyScopedUpdates(
  contents: string,
  headingScope: string,
  updateFn: (scopedContents: string) => string,
  settings?: { createHeading: boolean; settings: DayPlannerSettings },
) {
  if (headingScope.trim().length === 0) {
    return contents;
  }

  const heading = findHeading(contents, headingScope);

  if (heading?.start === undefined) {
    if (settings?.createHeading) {
      const { plannerHeadingLevel, plannerHeading } = settings.settings;
      const withHeading = appendHeading(
        contents,
        createHeading(plannerHeadingLevel, plannerHeading),
      );

      return applyScopedUpdates(withHeading, headingScope, updateFn);
    }

    return contents;
  }

  const lines = contents.split("\n");
  const beforeHeading = lines.slice(0, heading.start);
  const afterHeadingIndex = heading.start + heading.length;
  const toUpdate = lines.slice(heading.start, afterHeadingIndex).join("\n");
  const afterHeading = lines.slice(afterHeadingIndex);

  const updated = updateFn(toUpdate).split("\n");

  return beforeHeading.concat(updated, afterHeading).join("\n");
}

function findHeadingInLine(line: string) {
  const headingMatch = headingRegExp.exec(line);

  if (!headingMatch) {
    return undefined;
  }

  const [, tokens] = headingMatch;

  return { level: tokens.length };
}

function findHeading(text: string, headingText: string) {
  const lines = text.split("\n");

  const result: {
    start: number | undefined;
    length: number;
    level: number;
  } = {
    start: undefined,
    length: 0,
    level: 0,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = findHeadingInLine(line);
    const insideHeading = result.start !== undefined;

    if (insideHeading) {
      if (heading && heading.level <= result.level) {
        return result;
      }

      result.length++;
    } else {
      if (heading && line.includes(headingText)) {
        result.start = i;
        result.level = heading.level;
        result.length = 1;
      }
    }
  }

  if (result.start === undefined) {
    return undefined;
  }

  return result;
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

/**
 * Turns the changes to a view into a list of updates that can be applied to the vault.
 */
export function mapTaskDiffToUpdates(
  diff: ViewDiff,
  mode: EditMode,
  settings: DayPlannerSettings,
): Update[] {
  return Object.entries(diff)
    .flatMap(([type, tasks]) => tasks.map((task) => ({ type, task })))
    .reduce<Update[]>((result, { type, task }) => {
      const taskText = t.toString(task, mode);

      // todo: move out to a function
      if (type === "added") {
        if (task.location) {
          // todo: every test should have an operation
          if (mode === EditMode.SCHEDULE_SEARCH_RESULT) {
            return result.concat({
              type: "updated",
              path: task.location.path,
              range: {
                start: task.location.position.start,
                end: task.location.position.start,
              },
              contents: t.getFirstLine(taskText),
            });
          }

          return result.concat({
            type: "created",
            contents: taskText,
            path: task.location.path,
            target: task.location.position?.start?.line,
          });
        }

        return result.concat({
          type: "mdast",
          path: createDailyNotePath(task.startTime),
          updateFn: (root: Root) => {
            const taskRoot = fromMarkdown(taskText);
            const listItemToInsert = findFirst(taskRoot, checkListItem);

            isNotVoid(listItemToInsert);
            isListItem(listItemToInsert);

            return insertListItemUnderHeading(
              root,
              settings.plannerHeading,
              listItemToInsert,
            );
          },
        });
      }

      isNotVoid(task.location);

      const { path, position } = task.location;

      if (type === "deleted") {
        return result.concat({
          type: "deleted",
          path,
          range: position,
        });
      }

      const originalLocationDay = getDateFromPath(path, "day");
      const needToMoveBetweenNotes =
        originalLocationDay &&
        !task.startTime.isSame(originalLocationDay, "day");

      if (!needToMoveBetweenNotes) {
        return result.concat({
          type: "updated",
          path,
          range: { start: position.start, end: position.start },
          contents: t.getFirstLine(taskText),
        });
      }

      return result.concat(
        {
          type: "deleted",
          path,
          range: position,
        },
        {
          type: "mdast",
          // todo: duplication
          path: createDailyNotePath(task.startTime),
          updateFn: (root: Root) => {
            const taskRoot = fromMarkdown(taskText);
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
      );
    }, []);
}
