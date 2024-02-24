import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";

// We use layoutReady as a proxy to know when the vault is ready to be queried for daily nots
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
