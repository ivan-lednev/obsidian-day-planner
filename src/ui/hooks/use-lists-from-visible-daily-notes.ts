import { TFile } from "obsidian";
import { derived, type Readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import * as query from "../../util/dataview-query";

export function useListsFromVisibleDailyNotes(
  visibleDailyNotes: Readable<TFile[]>,
  debouncedTaskUpdateTrigger: Readable<unknown>,
  dataviewFacade: DataviewFacade,
) {
  return derived(
    [visibleDailyNotes, debouncedTaskUpdateTrigger],
    ([$visibleDailyNotes]) => {
      if ($visibleDailyNotes.length === 0) {
        return [];
      }

      return dataviewFacade.getAllListsFrom(query.anyOf($visibleDailyNotes));
    },
  );
}
