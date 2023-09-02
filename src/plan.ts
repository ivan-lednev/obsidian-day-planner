import { get } from "svelte/store";

import { getHeadingByText, getListItemsUnderHeading } from "./parser/parser";
import { appStore } from "./store/app-store";
import { settings } from "./store/settings";
import { replaceTimestamp } from "./timestamp/timestamp";
import type { PlanItem } from "./types";
import { selectText } from "./util/editor";
import { getFileByPath, openFileInEditor } from "./util/obsidian";

export function createPlannerHeading() {
  const { plannerHeading, plannerHeadingLevel } = get(settings);

  const headingTokens = "#".repeat(plannerHeadingLevel);

  return `${headingTokens} ${plannerHeading}`;
}

// todo: replace with mdast-util-from-markdown + custom stringify
export async function appendToPlan(path: string, planItem: PlanItem) {
  const app = get(appStore);
  const { plannerHeading } = get(settings);

  const file = getFileByPath(path);
  const metadata = app.metadataCache.getFileCache(file) || {};
  const editor = await openFileInEditor(file);

  let line = editor.lastLine();
  let result = replaceTimestamp(planItem, { ...planItem });

  const headingLine = getHeadingByText(metadata, plannerHeading);

  if (headingLine) {
    line = headingLine.position.start.line;
  } else {
    result = `${createPlannerHeading()}\n\n${result}`;
  }

  const listItems = getListItemsUnderHeading(metadata, plannerHeading);

  if (listItems?.length > 0) {
    const lastListItem = listItems[listItems.length - 1];

    line = lastListItem.position.start.line;
  } else if (headingLine) {
    result = `\n${result}`;
  }

  const ch = editor.getLine(line).length;

  editor.replaceRange(`\n${result}`, { line, ch });

  selectText(editor, planItem.firstLineText);
}
