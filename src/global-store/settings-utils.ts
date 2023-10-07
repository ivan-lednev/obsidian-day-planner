import { derived } from "svelte/store";

import { snapStepMinutes } from "../constants";
import { DayPlannerSettings } from "../settings";

import { settings } from "./settings";

export const hourSize = derived(
  settings,
  ($settings) => $settings.zoomLevel * 60,
);

export const visibleHours = derived(settings, ($settings) =>
  [...Array(24).keys()].slice($settings.startHour),
);

// todo: this is out of place
export const hiddenHoursSize = derived(
  [settings, hourSize],
  ([$settings, $hourSize]) => $settings.startHour * $hourSize,
);

export function getHourSize(settings: DayPlannerSettings) {
  return settings.zoomLevel * 60;
}

export function getHiddenHoursSize(settings: DayPlannerSettings) {
  return settings.startHour * getHourSize(settings);
}

// todo: this is out of place
export const timeToTimelineOffset = derived(
  settings,
  ($settings) => (minutes: number) =>
    minutes * $settings.zoomLevel - getHiddenHoursSize($settings),
);

// todo: out of place
export function snap(coords: number, zoomLevel: number) {
  return coords - (coords % (snapStepMinutes * zoomLevel));
}
