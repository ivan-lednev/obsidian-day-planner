import { derived, writable } from "svelte/store";
import { TFile, type App } from "obsidian";
import type { PlanItem } from "../plan-item";
import { SNAP_STEP_MINUTES } from "src/constants";
import { replaceTimestamp } from "src/util/timestamp";
import { settings } from "./settings";

export type Timestamp = { durationMinutes: number; startMinutes: number };

export const appStore = writable<App>();

export const tasks = writable<PlanItem[]>([]);

let app: App;

appStore.subscribe((current) => {
  app = current;
});

export async function updateDurationInDailyNote(
  task: PlanItem,
  startAndDuration: Timestamp,
) {
  const file = app.vault.getAbstractFileByPath(task.location.path);

  if (!(file instanceof TFile)) {
    throw new Error("Something is wrong");
  }

  const contents = await app.vault.read(file);
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

  await app.vault.modify(file, updated);
}

export const updateTimestamps = async (id: string, timestamp: Timestamp) => {
  tasks.update((previous) => {
    return previous.map((task) => {
      // todo: replace with ID
      if (task.text !== id) {
        return task;
      }

      updateDurationInDailyNote(task, timestamp);

      return {
        ...task,
        ...timestamp,
      };
    });
  });
};

export const hourSize = derived(
  settings,
  ($settings) => $settings.zoomLevel * 60,
);

export const hiddenHoursSize = derived(
  [settings, hourSize],
  ([$settings, $hourSize]) => $settings.startHour * $hourSize,
);

export const timeToTimelineOffset = derived(
  [settings, hiddenHoursSize],
  ([$settings, $hiddenHoursSize]) =>
    (minutes: number) =>
      minutes * $settings.zoomLevel - $hiddenHoursSize,
);

export const getTimeFromYOffset = derived(
  [settings, hiddenHoursSize],
  ([$settings, $hiddenHoursSize]) =>
    (yCoords: number) =>
      (yCoords + $hiddenHoursSize) / $settings.zoomLevel,
);

export const sizeToDuration = derived(
  settings,
  ($settings) => (size: number) => size / $settings.zoomLevel,
);

export const roundToSnapStep = derived(
  settings,
  ($settings) => (coords: number) =>
    coords - (coords % (SNAP_STEP_MINUTES * $settings.zoomLevel)),
);
