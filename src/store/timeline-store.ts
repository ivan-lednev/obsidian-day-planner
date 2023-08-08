import { derived, writable } from "svelte/store";
import type { App } from "obsidian";
import type { PlanItem } from "../plan-item";

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
