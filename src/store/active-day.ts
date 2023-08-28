import { getAllDailyNotes } from "obsidian-daily-notes-interface";
import { derived, get, writable } from "svelte/store";

import { getDailyNoteForToday, getDateUidForToday } from "../util/daily-notes";

export const dayShownInTimeline = writable(getDateUidForToday());

export const todayIsShownInTimeline = derived(
  dayShownInTimeline,
  ($dayShownInTimeline) =>
    getAllDailyNotes()[$dayShownInTimeline] === getDailyNoteForToday(),
);

export function getTimelineFile() {
  return getAllDailyNotes()[get(dayShownInTimeline)];
}
