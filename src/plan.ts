import { get } from "svelte/store";
import { settings } from "./store/settings";
import { appStore } from "./store/timeline-store";
import { getFileByPath, openFileInEditor } from "./util/obsidian";
import { replaceTimestamp } from "./timestamp/timestamp";
import { getHeadingByText, getListItemsUnderHeading } from "./parser/parser";
import { selectText } from "./util/editor";
import type { PlanItem } from "./types";

export function createPlannerHeading() {
  const { plannerHeading, plannerHeadingLevel } = get(settings);

  const headingTokens = "#".repeat(plannerHeadingLevel);

  return `${headingTokens} ${plannerHeading}`;
}

export async function appendToPlan(path: string, planItem: PlanItem) {
  const app = get(appStore);
  const { plannerHeading } = get(settings);

  const file = await getFileByPath(path);
  const metadata = app.metadataCache.getFileCache(file);
  const editor = await openFileInEditor(file);

  let result = replaceTimestamp(planItem, { ...planItem });

  const headingLine = getHeadingByText(metadata, plannerHeading);

  let line = editor.lastLine();

  if (!headingLine) {
    result = `${createPlannerHeading()}\n\n${result}`;
  } else {
    line = headingLine.position.start.line;
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

  selectText(editor, planItem.text);
}
