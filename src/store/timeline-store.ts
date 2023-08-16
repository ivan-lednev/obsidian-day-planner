import { derived, get, writable } from "svelte/store";
import type { PlanItem } from "../plan-item";
import { SNAP_STEP_MINUTES } from "src/constants";
import { settings } from "./settings";
import type { App } from "obsidian";

export type Timestamp = { durationMinutes: number; startMinutes: number };

export const appStore = writable<App>();

export const tasks = writable<PlanItem[]>([]);

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

export function roundToSnapStep(coords: number) {
  return coords - (coords % (SNAP_STEP_MINUTES * get(settings).zoomLevel));
}

export function getTimeFromYOffset(yCoords: number) {
  return (yCoords + get(hiddenHoursSize)) / get(settings).zoomLevel;
}

export function sizeToDuration(size: number) {
  return size / get(settings).zoomLevel;
}
