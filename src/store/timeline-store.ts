import { derived, get, writable } from "svelte/store";
import { SNAP_STEP_MINUTES } from "../constants";
import { settings } from "./settings";
import type { App } from "obsidian";
import type { PlanItem } from "../types";
import { computeOverlap } from "../parser/overlap";
import { getAllDailyNotes, getDateUID } from "obsidian-daily-notes-interface";
import { refreshPlanItemsInStore } from "../util/obsidian";
import { getDailyNoteForToday, getMomentFromUid } from "../util/daily-notes";

export type Timestamp = { durationMinutes: number; startMinutes: number };

export const appStore = writable<App>();

export const tasks = writable<PlanItem[]>([]);

tasks.subscribe(console.log);

export const overlapLookup = derived(tasks, ($tasks) => computeOverlap($tasks));

export const activeDay = writable(getDateUID(window.moment(), "day"));

export const activeDayShown = derived(
  activeDay,
  ($activeDay) => getAllDailyNotes()[$activeDay] === getDailyNoteForToday(),
);

export function getMomentOfActiveDay() {
  return getMomentFromUid(get(activeDay));
}

activeDay.subscribe(async () => {
  await refreshPlanItemsInStore();
});

export function getTimelineFile() {
  return getAllDailyNotes()[get(activeDay)];
}

export const hourSize = derived(
  settings,
  ($settings) => $settings.zoomLevel * 60,
);

export const visibleHours = derived(settings, ($settings) =>
  [...Array(24).keys()].slice($settings.startHour),
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

export function roundToSnapStep(coords: number) {
  const { zoomLevel } = get(settings);
  return coords - (coords % (SNAP_STEP_MINUTES * zoomLevel));
}

export function getTimeFromYOffset(yCoords: number) {
  const { zoomLevel } = get(settings);
  return (yCoords + get(hiddenHoursSize)) / zoomLevel;
}

export function sizeToDuration(size: number) {
  const { zoomLevel } = get(settings);
  return size / zoomLevel;
}

export const durationToSize = derived(settings, ($settings) => {
  return (duration: number) => {
    const { zoomLevel } = $settings;
    return duration * zoomLevel;
  };
});
