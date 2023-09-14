import { get } from "svelte/store";

import { appStore } from "../global-stores/app-store";
import { settings } from "../global-stores/settings";
import { getHeadingByText, getListItemsUnderHeading } from "../parser/parser";
import { replaceTimestamp } from "../parser/timestamp/timestamp";
import type { PlanItem } from "../types";

import { selectText } from "./editor";
import { getFileByPath, openFileInEditor } from "./obsidian";

// todo: delete this once we've replaced the hooks
export function createPlannerHeading() {
  const { plannerHeading, plannerHeadingLevel } = get(settings);

  const headingTokens = "#".repeat(plannerHeadingLevel);

  return `${headingTokens} ${plannerHeading}`;
}

// todo: remove this once we've replaced the hooks
export async function appendToPlan(path: string, planItem: PlanItem) {
  const app = get(appStore);
  const { plannerHeading } = get(settings);

  const file = getFileByPath(path);
  const metadata = app.metadataCache.getFileCache(file) || {};
  const editor = await openFileInEditor(file);

  let line = editor.lastLine();
  let result = replaceTimestamp(planItem, { ...planItem });

  const cachedHeading = getHeadingByText(metadata, plannerHeading);

  if (cachedHeading) {
    line = cachedHeading.position.start.line;
  } else {
    result = `${createPlannerHeading()}\n\n${result}`;
  }

  const listItems = getListItemsUnderHeading(metadata, plannerHeading);

  if (listItems?.length > 0) {
    const lastListItem = listItems[listItems.length - 1];

    line = lastListItem.position.start.line;
  } else if (cachedHeading) {
    result = `\n${result}`;
  }

  const ch = editor.getLine(line).length;

  editor.replaceRange(`\n${result}`, { line, ch });

  selectText(editor, planItem.firstLineText);
}
