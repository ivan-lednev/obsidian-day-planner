import { MetadataCache } from "obsidian";
import { DataArray, STask } from "obsidian-dataview";
import { derived, get, Readable, readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import { DayPlannerSettings } from "../../settings";
import * as query from "../../util/dataview-query";
import { debounceWithDelay } from "../../util/debounce-with-delay";

import { useVisibleDailyNotes } from "./use-visible-daily-notes";

export interface UseDataviewTasksProps {
  visibleDailyNotes: ReturnType<typeof useVisibleDailyNotes>;
  settings: Readable<DayPlannerSettings>;
  metadataCache: MetadataCache;
  dataviewFacade: DataviewFacade;
}

// TODO: split debouncing from the details of how different sources and task types get mixed
export function useDebouncedDataviewTasks({
  visibleDailyNotes,
  settings,
  metadataCache,
  dataviewFacade,
}: UseDataviewTasksProps) {
  function getTasksFromCombinedSources() {
    const dailyNotePathsFragment = query.anyOf(
      // todo: we don't subscribe to it, so it's always empty
      get(visibleDailyNotes),
    );

    const listsFromDailyNotes = dataviewFacade.getAllListsFrom(
      dailyNotePathsFragment,
    );
    const dataviewSource = get(settings).dataviewSource;

    if (dataviewSource.trim().length === 0) {
      return listsFromDailyNotes;
    }

    const queryFromExtraSources = query.andNot(
      dataviewSource,
      dailyNotePathsFragment,
    );
    const tasksFromExtraSources = dataviewFacade.getAllTasksFrom(
      queryFromExtraSources,
    );

    // TODO: fix type cast
    //  note that SListItem still works fine. It has everything a task has
    return listsFromDailyNotes.concat(
      tasksFromExtraSources,
    ) as unknown as DataArray<STask>;
  }

  return readable(getTasksFromCombinedSources(), (set) => {
    const [scheduleUpdate, delayUpdate] = debounceWithDelay(() => {
      set(getTasksFromCombinedSources());
      /* todo: this timeout might not be needed:
        - a long value prevents consecutive drag and drop
        - a short value - and there might be jank with typing if the user has too many files
        - but actually
      */
    }, 200);

    const eventRef = metadataCache.on(
      // @ts-expect-error
      "dataview:metadata-change",
      scheduleUpdate,
    );

    document.addEventListener("keydown", delayUpdate);

    const source = derived(settings, ($settings) => {
      return $settings.dataviewSource;
    });

    const unsubscribeFromSettings = source.subscribe(() => {
      scheduleUpdate();
    });

    return () => {
      metadataCache.offref(eventRef);
      document.removeEventListener("keydown", delayUpdate);
      unsubscribeFromSettings();
    };
  });
}
