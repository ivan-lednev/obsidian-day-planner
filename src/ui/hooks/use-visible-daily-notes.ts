import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";

export function useVisibleDailyNotes(layoutReady: Readable<boolean>) {
  return derived([layoutReady, visibleDays], ([$layoutReady, $visibleDays]) => {
    if (!$layoutReady) {
      return [];
    }

    const allDailyNotes = getAllDailyNotes();

    return $visibleDays
      .map((day) => getDailyNote(day, allDailyNotes))
      .filter(Boolean);
  });
}
