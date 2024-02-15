import { MetadataCache } from "obsidian";
import { DataArray, STask } from "obsidian-dataview";
import { derived, get, Readable, readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import { DayPlannerSettings } from "../../settings";
import { useVisibleDailyNotes } from "../../util/create-hooks";
import { debounceWithDelay } from "../../util/debounce-with-delay";

export interface UseDataviewTasksProps {
  visibleDailyNotes: ReturnType<typeof useVisibleDailyNotes>;
  settings: Readable<DayPlannerSettings>;
  metadataCache: MetadataCache;
  getAllListsFrom: ReturnType<DataviewFacade["getAllListsFrom"]>;
  getAllTasksFrom: ReturnType<DataviewFacade["getAllTasksFrom"]>;
}

// TODO: split debouncing from the details of how different sources and task types get mixed
export function useDebouncedDataviewTasks({
  visibleDailyNotes,
  settings,
  metadataCache,
  getAllTasksFrom,
  getAllListsFrom,
}: UseDataviewTasksProps) {
  function getTasksFromCombinedSources() {
    const dailyNotePathsFragment = get(visibleDailyNotes)
      .map((note) => `"${note.path}"`)
      .join(" OR ");
    const listsFromDailyNotes = getAllListsFrom(dailyNotePathsFragment);
    const dataviewSource = get(settings).dataviewSource;

    if (dataviewSource.trim().length === 0) {
      return listsFromDailyNotes;
    }

    const extraSourcesFragment = `${dataviewSource} AND -(${dailyNotePathsFragment})`;

    // TODO: fix type cast
    //  note that SListItem still works fine. It has everything a task has
    return listsFromDailyNotes.concat(
      getAllTasksFrom(extraSourcesFragment),
    ) as unknown as DataArray<STask>;
  }

  return readable(getTasksFromCombinedSources(), (set) => {
    const [updateTasks, delayUpdateTasks] = debounceWithDelay(() => {
      set(getTasksFromCombinedSources());
    }, 1000);

    metadataCache.on(
      // @ts-expect-error
      "dataview:metadata-change",
      updateTasks,
    );
    document.addEventListener("keydown", delayUpdateTasks);

    const source = derived(settings, ($settings) => {
      return $settings.dataviewSource;
    });

    const unsubscribeFromSettings = source.subscribe(() => {
      updateTasks();
    });

    return () => {
      // todo: this potentially creates a leak. try offref
      metadataCache.off("dataview:metadata-change", updateTasks);
      document.removeEventListener("keydown", delayUpdateTasks);
      unsubscribeFromSettings();
    };
  });
}
