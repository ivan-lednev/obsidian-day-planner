import { derived, get, writable } from "svelte/store";
import { PlanSummaryData } from "./plan-data";

interface Task {
  startMinutes: number;
  durationMinutes: number;
  text: string;
}

export const planSummary = writable(new PlanSummaryData([]));

export const tasks = writable([]);

export const nowPosition = writable(0);

export const now = writable(new Date());

export const zoomLevel = writable(2);

export const hourSize = derived(zoomLevel, ($zoomLevel) => $zoomLevel * 60);

export const startHour = writable(6);

export function getCoords(minutes: number) {
  const currentZoomLevel = get(zoomLevel);
  const hiddenHoursSize = get(startHour) * 60 * currentZoomLevel
  return minutes * currentZoomLevel - hiddenHoursSize;
}
