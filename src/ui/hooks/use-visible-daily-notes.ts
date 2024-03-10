import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";

/**
 *
 * @param layoutReady used as a proxy that lets us know when the vault is ready to be queried for daily notes
 * @param debouncedTaskUpdateTrigger lets us know when some files changed, and we need to re-run
 */
export function useVisibleDailyNotes(
  layoutReady: Readable<boolean>,
  debouncedTaskUpdateTrigger: Readable<unknown>,
) {
  return derived(
    [layoutReady, visibleDays, debouncedTaskUpdateTrigger],
    ([$layoutReady, $visibleDays]) => {
      if (!$layoutReady) {
        return [];
      }

      const allDailyNotes = getAllDailyNotes();

      return $visibleDays
        .map((day) => getDailyNote(day, allDailyNotes))
        .filter(Boolean);
    },
  );
}
