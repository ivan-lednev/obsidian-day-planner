import { Moment } from "moment";
import { MetadataCache, TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { onDestroy } from "svelte";
import { get, Readable, writable } from "svelte/store";

import { addPlacing } from "../../overlap/overlap";
import { DataviewFacade } from "../../service/dataview-facade";

interface UseTaskSourceProps {
  day: Readable<Moment>;
  metadataCache: MetadataCache;
  dataviewFacade: DataviewFacade;
}

// todo: this is a custom store, not a hook
export function useTasksForDay({
  day,
  metadataCache,
  dataviewFacade,
}: UseTaskSourceProps) {
  const initial = getPlacedTasksFor(get(day));
  const tasks = writable(initial);

  function getPlacedTasksFor(moment: Moment) {
    const tasks = [...dataviewFacade.getTasksFor(moment)];
    return tasks.length > 0 ? addPlacing(tasks) : [];
  }

  async function handleChanged(changedFile: TFile) {
    const noteForDay = getDailyNote(get(day), getAllDailyNotes());

    if (noteForDay.path === changedFile.path) {
      tasks.set(getPlacedTasksFor(get(day)));
    }
  }

  day.subscribe((updated) => {
    tasks.set(getPlacedTasksFor(updated));
  });

  // @ts-expect-error
  metadataCache.on("dataview:metadata-change", handleChanged);

  onDestroy(() => {
    metadataCache.off("dataview:metadata-change", handleChanged);
  });

  return tasks;
}
