import type { App } from "obsidian";
import { derived, get, Writable, writable } from "svelte/store";

import { SNAP_STEP_MINUTES } from "../constants";
import type { PlanItem } from "../types";

import { settings } from "./settings";

export type Timestamp = {
  durationMinutes: number;
  startMinutes: number;
};

export const appStore = writable<App>();

export const tasks = writable<PlanItem[]>([]);

export const taskLookup = writable<Record<string, Writable<Array<PlanItem>>>>();

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
