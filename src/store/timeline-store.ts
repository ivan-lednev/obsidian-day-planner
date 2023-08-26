import { derived, get } from "svelte/store";

import { SNAP_STEP_MINUTES } from "../constants";

import { settings } from "./settings";

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
