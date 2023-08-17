import { Editor, TFile } from "obsidian";
import type { PlanItem } from "./plan-item";
import { derived, get } from "svelte/store";
import { Timestamp, appStore } from "./store/timeline-store";
import { replaceTimestamp } from "./util/timestamp";
import { getHeadingByText, getListItemsUnderHeading } from "./parser/parser";
import { settings } from "./store/settings";
import { createPlannerHeading } from "./create-plan";

// todo: no reactivity is needed here
export const updateDurationInDailyNote = derived(appStore, ($appStore) => {
  return async (task: PlanItem, startAndDuration: Timestamp) => {
    const file = $appStore.vault.getAbstractFileByPath(task.location.path);

    if (!(file instanceof TFile)) {
      throw new Error("Something is wrong");
    }

    const contents = await $appStore.vault.read(file);
    // todo: this is inefficient
    const updated = contents
      .split("\n")
      .map((line, i) => {
        if (i === task.location.line) {
          return replaceTimestamp(task, startAndDuration);
        }

        return line;
      })
      .join("\n");

    await $appStore.vault.modify(file, updated);
  };
});

export async function appendUnderHeading(path: string, planItem: PlanItem) {
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

function selectText(editor: Editor, text: string) {
  const startOffset = editor.getValue().indexOf(text);
  const endOffset = startOffset + text.length;

  editor.setSelection(
    editor.offsetToPos(startOffset),
    editor.offsetToPos(endOffset),
  );
}

async function openFileInEditor(file: TFile) {
  const app = get(appStore);

  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  return app.workspace.activeEditor?.editor;
}

async function getFileByPath(path: string) {
  const app = get(appStore);

  const file = app.vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    throw new Error(`Unable to open file: ${path}`);
  }

  return file;
}
