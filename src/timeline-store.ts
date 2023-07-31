import { derived, get, writable } from "svelte/store";
import { PlanSummaryData } from "./plan-data";

// todo: use or delete
interface Task {
  startMinutes: number;
  durationMinutes: number;
  text: string;
}

export const planSummary = writable(new PlanSummaryData([]));

export const tasks = writable([]);

export const nowPosition = writable(0);

export const now = writable(new Date());

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

const createGetYCoordsFn =
  ([$zoomLevel, $startHour]: [string, number]) =>
  (minutes: number) => {
    const currentZoomLevel = Number($zoomLevel);
    const hiddenHoursSize = $startHour * 60 * currentZoomLevel;
    return minutes * currentZoomLevel - hiddenHoursSize;
  };

export const getYCoords = derived([zoomLevel, startHour], createGetYCoordsFn);
