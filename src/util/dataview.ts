import { isNotVoid } from "typed-assert";

import { indentBeforeListParagraph } from "../constants";
import type { ListItemTokens } from "../task-types";

import { checkbox } from "./markdown";

export interface Node {
  text: string;
  symbol: string;
  children?: Node[];
  status?: string;
}

export function getIndentationForListParagraph() {
  return " ".repeat(indentBeforeListParagraph);
}

export function getFirstLineAsMarkdown(listItemEntry: Node) {
  const firstLine = listItemEntry.text.split("\n")[0];

  isNotVoid(firstLine);

  return `${createMarkdownListTokens(listItemEntry)} ${firstLine}`;
}

export function createMarkdownListTokens(listItem: ListItemTokens) {
  if (listItem.status === undefined && listItem.task === undefined) {
    return listItem.symbol;
  }

  return `${listItem.symbol} ${checkbox(listItem.status || listItem.task || " ")}`;
}
