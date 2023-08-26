import { getAllDailyNotes } from "obsidian-daily-notes-interface";
import { derived, get, writable } from "svelte/store";

import { getDailyNoteForToday, getDateUidForToday } from "../util/daily-notes";

export const activeDay = writable(getDateUidForToday());

export const todayIsShownInTimeline = derived(
  activeDay,
  ($activeDay) => getAllDailyNotes()[$activeDay] === getDailyNoteForToday(),
);

export function getTimelineFile() {
  return getAllDailyNotes()[get(activeDay)];
}
