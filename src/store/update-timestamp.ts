import { flow, map } from "lodash/fp";
import { TFile } from "obsidian";
import { get, Writable } from "svelte/store";

import { replaceTimestamp } from "../timestamp/timestamp";
import type { PlanItem, Timestamp } from "../types";
import { addPlacing } from "../util/obsidian";

import { appStore } from "./app-store";

export async function updateTimestamps(
  tasks: Writable<Array<PlanItem>>,
  id: string,
  timestamp: Timestamp,
) {
  tasks.update(
    flow(
      map((task) => {
        if (task.id !== id) {
          return task;
        }

        // todo: split effect from mapping
        updateDurationInDailyNote(task, timestamp);

        return {
          ...task,
          ...timestamp,
        };
      }),
      addPlacing,
    ),
  );
}

async function updateDurationInDailyNote(
  task: PlanItem,
  startAndDuration: Timestamp,
) {
  const { vault } = get(appStore);

  const file = vault.getAbstractFileByPath(task.location.path);

  if (!(file instanceof TFile)) {
    // todo: we can do better
    throw new Error("Something is wrong");
  }

  const contents = await vault.read(file);
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

  await vault.modify(file, updated);
}
