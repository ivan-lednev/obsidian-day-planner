import { derived, writable } from "svelte/store";

// todo: use or delete
interface Task {
  startMinutes: number;
  durationMinutes: number;
  text: string;
}

export const tasks = writable([]);

// todo: no defaults in here
export const zoomLevel = writable("2");

export const hourSize = derived(
  zoomLevel,
  ($zoomLevel) => Number($zoomLevel) * 60,
);

// todo: no defaults in here
export const startHour = writable(6);

// todo: no defaults in here
export const timelineDateFormat = writable("LLLL");

export const centerNeedle = writable(true);

const hiddenHoursSize = derived(
  [startHour, hourSize],
  ([$startHour, $hourSize]) => $startHour * $hourSize,
);

export const endOfDayCoords = derived(
  [hourSize, hiddenHoursSize],
  ([$hourSize, $hiddenHoursSize]) => 24 * $hourSize - $hiddenHoursSize,
);

export const getYCoords = derived(
  [zoomLevel, hiddenHoursSize],
  ([$zoomLevel, $hiddenHoursSize]) =>
    (minutes: number) =>
      minutes * Number($zoomLevel) - $hiddenHoursSize,
);
