import { derived, get } from "svelte/store";

import { snapStepMinutes } from "../constants";

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

// todo: this is out of place
export const timeToTimelineOffset = derived(
  [settings, hiddenHoursSize],
  ([$settings, $hiddenHoursSize]) =>
    (minutes: number) =>
      minutes * $settings.zoomLevel - $hiddenHoursSize,
);

export function snap(coords: number, zoomLevel: number) {
  return coords - (coords % (snapStepMinutes * zoomLevel));
}

// todo: this is out of place
export function getTimeFromYOffset(yCoords: number) {
  const { zoomLevel } = get(settings);
  return (yCoords + get(hiddenHoursSize)) / zoomLevel;
}

// todo: this is out of place
export function sizeToDuration(size: number) {
  const { zoomLevel } = get(settings);
  return size / zoomLevel;
}

// todo: this is out of place
export const durationToSize = derived(settings, ($settings) => {
  return (duration: number) => {
    const { zoomLevel } = $settings;
    return duration * zoomLevel;
  };
});
