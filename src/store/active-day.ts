import {
  getDailyNoteForToday,
  getDateUidForToday,
  getMomentFromUid,
} from "../util/daily-notes";
import { derived, get, writable } from "svelte/store";
import { getAllDailyNotes } from "obsidian-daily-notes-interface";
import { refreshPlanItemsInStore } from "../util/obsidian";

export const activeDay = writable(getDateUidForToday());

activeDay.subscribe(async () => {
  await refreshPlanItemsInStore();
});

export const todayIsShownInTimeline = derived(
  activeDay,
  ($activeDay) => getAllDailyNotes()[$activeDay] === getDailyNoteForToday(),
);

export function getMomentOfActiveDay() {
  return getMomentFromUid(get(activeDay));
}

export function getTimelineFile() {
  return getAllDailyNotes()[get(activeDay)];
}
