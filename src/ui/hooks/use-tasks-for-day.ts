import { Moment } from "moment";
import { MetadataCache, TFile } from "obsidian";
import { onDestroy } from "svelte";
import { get, Readable, writable } from "svelte/store";

import { addPlacing } from "../../overlap/overlap";
import { DataviewFacade } from "../../service/dataview-facade";

interface UseTaskSourceProps {
  day: Readable<Moment>;
  metadataCache: MetadataCache;
  dataviewFacade: DataviewFacade;
}

export function useTasksForDay({
  day,
  metadataCache,
  dataviewFacade,
}: UseTaskSourceProps) {
  const initial = getPlacedTasksFor(get(day));
  const tasks = writable(initial);

  function getPlacedTasksFor(moment: Moment) {
    return addPlacing(dataviewFacade.getTasksFor(moment));
  }

  async function handleChanged(operation: string, changedFile: TFile) {
    const taskPaths = get(tasks).map((task) => task.location.path);
    // todo: this is not going to work if I add a new task in a new file
    const relatedFileChanged = taskPaths.some(
      (path) => path === changedFile.path,
    );

    if (relatedFileChanged) {
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
