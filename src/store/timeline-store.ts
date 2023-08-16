import { derived, writable } from "svelte/store";
import { TFile, type App } from "obsidian";
import type { PlanItem } from "../plan-item";
import { SNAP_STEP_MINUTES } from "src/constants";
import { replaceTimestamp } from "src/util/timestamp";

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

export const zoomLevel = writable("2");

export const hourSize = derived(
  zoomLevel,
  ($zoomLevel) => Number($zoomLevel) * 60,
);

export const startHour = writable(0);

export const timelineDateFormat = writable();

export const centerNeedle = writable(true);

export const hiddenHoursSize = derived(
  [startHour, hourSize],
  ([$startHour, $hourSize]) => $startHour * $hourSize,
);

export const timeToTimelineOffset = derived(
  [zoomLevel, hiddenHoursSize],
  ([$zoomLevel, $hiddenHoursSize]) =>
    (minutes: number) =>
      minutes * Number($zoomLevel) - $hiddenHoursSize,
);

export const getTimeFromYOffset = derived(
  [zoomLevel, hiddenHoursSize],
  ([$zoomLevel, $hiddenHoursSize]) =>
    (yCoords: number) =>
      (yCoords + $hiddenHoursSize) / Number($zoomLevel),
);

export const durationToCoords = derived(
  zoomLevel,
  ($zoomLevel) => (durationMinutes: number) =>
    durationMinutes / Number($zoomLevel),
);

export const roundToSnapStep = derived(
  zoomLevel,
  ($zoomLevel) => (coords: number) =>
    coords - (coords % (SNAP_STEP_MINUTES * Number($zoomLevel))),
);
