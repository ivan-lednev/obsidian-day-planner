import { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived, Readable } from "svelte/store";

/**
 *
 * @param layoutReady used as a proxy that lets us know when the vault is ready to be queried for daily notes
 * @param debouncedTaskUpdateTrigger lets us know when some files changed, and we need to re-run
 * @param visibleDays
 */
export function useVisibleDailyNotes(
  layoutReady: Readable<boolean>,
  debouncedTaskUpdateTrigger: Readable<unknown>,
  visibleDays: Readable<Moment[]>,
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
