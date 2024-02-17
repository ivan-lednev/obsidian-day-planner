import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";

export function useVisibleDailyNotes(isDataviewLoaded: Readable<boolean>) {
  return derived(
    [isDataviewLoaded, visibleDays],
    ([$isDataviewLoaded, $visibleDays]) => {
      // todo: move this guard up the signal chain
      if (!$isDataviewLoaded) {
        return [];
      }

      const allDailyNotes = getAllDailyNotes();

      return $visibleDays
        .map((day) => getDailyNote(day, allDailyNotes))
        .filter(Boolean);
    },
  );
}
