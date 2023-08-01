import { derived, writable } from "svelte/store";

export const tasks = writable([]);

export const zoomLevel = writable();

export const hourSize = derived(
  zoomLevel,
  ($zoomLevel) => Number($zoomLevel) * 60,
);

export const startHour = writable(0);

export const timelineDateFormat = writable();

export const centerNeedle = writable();

const hiddenHoursSize = derived(
  [startHour, hourSize],
  ([$startHour, $hourSize]) => $startHour * $hourSize,
);

export const getYCoords = derived(
  [zoomLevel, hiddenHoursSize],
  ([$zoomLevel, $hiddenHoursSize]) =>
    (minutes: number) =>
      minutes * Number($zoomLevel) - $hiddenHoursSize,
);
