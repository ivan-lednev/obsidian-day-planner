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

  const headingMetadata = getHeadingByText(metadata, plannerHeading);

  if (!headingMetadata) {
    result = `${createPlannerHeading()}\n\n${result}`;
  }

  const listItems = getListItemsUnderHeading(metadata, plannerHeading);
  const lastListItem = listItems[listItems.length - 1];

  const line = lastListItem
    ? lastListItem.position.start.line
    : editor.lastLine();

  const ch = editor.getLine(line).length;

  editor.replaceRange(`\n${result}`, { line, ch });

  selectText(editor, planItem.text);
}
