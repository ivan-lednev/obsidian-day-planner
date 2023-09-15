import { flow, map } from "lodash/fp";
import { TFile } from "obsidian";
import { get, Writable } from "svelte/store";
import { isInstanceOf } from "typed-assert";

import { addPlacing } from "../overlap/overlap";
import { replaceTimestamp } from "../parser/timestamp/timestamp";
import type { PlanItem, Timestamp } from "../types";

import { appStore } from "./app-store";

// todo: delete when class is used everywhere instead of this
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

        const updatedTime = {
          ...timestamp,
          endMinutes: timestamp.startMinutes + timestamp.durationMinutes,
        };

        return {
          ...task,
          ...updatedTime,
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

  isInstanceOf(file, TFile, `${task.location.path} is not a markdown file`);

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
