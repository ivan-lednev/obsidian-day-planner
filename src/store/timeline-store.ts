import { derived, writable } from "svelte/store";
import type { App } from "obsidian";
import type { PlanItem } from "../plan-item";
import { SNAP_STEP_MINUTES } from "src/constants";

export const appStore = writable<App>();

export const tasks = writable<PlanItem[]>([]);

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

export const getYCoords = derived(
  [zoomLevel, hiddenHoursSize],
  ([$zoomLevel, $hiddenHoursSize]) =>
    (minutes: number) =>
      minutes * Number($zoomLevel) - $hiddenHoursSize,
);

export const getMinutesFromYCoords = derived(
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
