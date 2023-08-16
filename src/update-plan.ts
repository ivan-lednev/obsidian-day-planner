import { TFile } from "obsidian";
import type { PlanItem } from "./plan-item";
import { derived, get } from "svelte/store";
import { Timestamp, appStore } from "./store/timeline-store";
import { replaceTimestamp } from "./util/timestamp";
import { getListItemsUnderHeading } from "./parser/parser";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { getDailyNoteForToday } from "./util/daily-notes";

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

// todo: clean up
export async function insertPlanItem(path: string, planItem: PlanItem) {
  const app = get(appStore);
  const file = app.vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    throw new Error("Something is wrong");
  }

  const contents = await app.vault.read(file);

  const metadata = this.app.metadataCache.getFileCache(getDailyNoteForToday());

  // todo: do not hardcode
  const listItems = getListItemsUnderHeading(metadata, "Day planner");
  const lastLine = listItems[listItems.length - 1].position.start.line + 1;

  const text = replaceTimestamp(planItem, { ...planItem });

  const updatedContents = contents.split("\n");
  updatedContents.splice(lastLine, 0, text);

  await app.vault.modify(file, updatedContents.join("\n"));

  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  const editor = app.workspace.activeEditor?.editor;

  editor.setSelection(
    { line: lastLine, ch: text.indexOf(planItem.text) },
    { line: lastLine, ch: editor.getLine(lastLine).length },
  );
}
