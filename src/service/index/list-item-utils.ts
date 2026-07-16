import type { ListItemCache } from "obsidian";
import { isNotVoid, isRecordOfType } from "typed-assert";

import {
  createTaskEntryId,
  type DenormalizedListItemEntry,
} from "../../redux/index/index-slice";
import { listItemRegExp } from "../../regexp";
import { getFirstLine } from "../../util/markdown";
import { getTextAtPosition } from "../../util/metadata";

export function flatten<T extends { children?: T[]; id: string }>(
  node: T,
): Array<Omit<T, "children"> & { childIds?: string[] }> {
  const { children, ...rest } = node;

  return [
    {
      ...rest,
      ...(children
        ? { childIds: (children ?? []).map((child) => child.id) }
        : {}),
    },
    ...(children ?? []).flatMap(flatten),
  ];
}

function parseListItemLine(line: string) {
  const match = line.match(listItemRegExp);

  isRecordOfType<string>(
    match?.groups,
    (value) => typeof value === "string",
    "Mismatching named regexp groups",
  );

  const { symbol, text = "", task } = match.groups;

  isNotVoid(symbol);

  return { task, symbol, text: text.trim() };
}

export function createListItemEntry(props: {
  path: string;
  contents: string;
  listItemCache: ListItemCache;
}): DenormalizedListItemEntry {
  const { path, listItemCache, contents } = props;

  const id = createTaskEntryId(path, listItemCache.position.start.line);

  const fullListItemText = getTextAtPosition(contents, listItemCache.position);
  const rawFirstLine = getFirstLine(fullListItemText);

  const { text: firstLineText, symbol, task } = parseListItemLine(rawFirstLine);

  const trimmedLinesAfterFirst = fullListItemText
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .join("\n");

  const listItemTextInIndex =
    trimmedLinesAfterFirst.length > 0
      ? firstLineText + "\n" + trimmedLinesAfterFirst
      : firstLineText;

  return {
    id,
    text: listItemTextInIndex,
    symbol,
    task,
    position: listItemCache.position,
    path,
    children: [],
    logEntries: [],
    planEntries: [],
  };
}
