import type { Moment } from "moment";
import { Notice } from "obsidian";
import type { Readable } from "svelte/store";
import { derived } from "svelte/store";

import type { PeriodicNotes } from "../../service/periodic-notes";

/**
 *
 * @param layoutReady used as a proxy that lets us know when the vault is ready to be queried for daily notes
 * @param debouncedTaskUpdateTrigger lets us know when some files changed, and we need to re-run
 * @param visibleDays
 * @param periodicNotes
 */
export function useVisibleDailyNotes(
  layoutReady: Readable<boolean>,
  debouncedTaskUpdateTrigger: Readable<unknown>,
  visibleDays: Readable<Moment[]>,
  periodicNotes: PeriodicNotes,
) {
  function getAllDailyNotesSafely() {
    try {
      return periodicNotes.getAllDailyNotes();
    } catch (error) {
      console.error(error);

      const errorMessage = error instanceof Error ? error.message : error;

      new Notice(`Could not read daily notes. Reason: ${errorMessage}`);

      return {};
    }
  }

  return derived(
    [layoutReady, visibleDays, debouncedTaskUpdateTrigger],
    ([$layoutReady, $visibleDays]) => {
      if (!$layoutReady) {
        return [];
      }

      const allDailyNotes = getAllDailyNotesSafely();

      return $visibleDays
        .map((day) => periodicNotes.getDailyNote(day, allDailyNotes))
        .filter(Boolean);
    },
  );
}
