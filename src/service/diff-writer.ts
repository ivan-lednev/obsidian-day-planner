import { groupBy } from "lodash/fp";
import type { Root } from "mdast";

import { fromMarkdown, toMarkdown } from "../mdast/mdast";
import type { LocalTask, WithTime } from "../task-types";

import type { VaultFacade } from "./vault-facade";

export type WriterDiff = {
  updated: WithTime<LocalTask>[];
  created: WithTime<LocalTask>[];
  moved: { dayKey: string; task: WithTime<LocalTask> }[];
};

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
  target?: number;
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
    // todo: remove this
    if (typeof rangeUpdate.target === "number") {
      result.splice(rangeUpdate.target, 0, rangeUpdate.contents);
    }

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
  afterEach?: (contents: string) => string;
}) {
  const { updates, afterEach } = props;
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
        .toSorted(sortRangeUpdates)
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

      const asMarkdown = toMarkdown(withMdastUpdatesApplied);

      return afterEach ? afterEach(asMarkdown) : asMarkdown;
    },
  }));
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

  revert = async () => {
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
