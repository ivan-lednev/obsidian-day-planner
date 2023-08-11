import { TFile } from "obsidian";
import type { PlanItem } from "./plan-item";
import { derived } from "svelte/store";
import { Timestamp, appStore } from "./store/timeline-store";
import { replaceTimestamp } from "./util/timestamp";

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
