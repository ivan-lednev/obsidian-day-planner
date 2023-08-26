import { getAllDailyNotes } from "obsidian-daily-notes-interface";
import { derived, get, writable } from "svelte/store";

import { getDailyNoteForToday, getDateUidForToday } from "../util/daily-notes";
import { refreshPlanItemsInStore } from "../util/obsidian";

export const activeDay = writable(getDateUidForToday());

activeDay.subscribe(async () => {
  await refreshPlanItemsInStore();
});

export const todayIsShownInTimeline = derived(
  activeDay,
  ($activeDay) => getAllDailyNotes()[$activeDay] === getDailyNoteForToday(),
);

export function getTimelineFile() {
  return getAllDailyNotes()[get(activeDay)];
}
