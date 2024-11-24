import type { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";

interface UseTasksFromExtraSourcesProps {
  dataviewSource: Readable<string>;
  refreshSignal: Readable<unknown>;
  dataviewFacade: DataviewFacade;
}

export function useTasksFromExtraSources({
  dataviewSource,
  refreshSignal,
  dataviewFacade,
}: UseTasksFromExtraSourcesProps) {
  return derived(
    [dataviewSource, refreshSignal],
    ([$dataviewSource], set: (tasks: STask[]) => void) => {
      dataviewFacade.getAllTasksFrom($dataviewSource).then(set, (reason) => {
        console.error("Failed to fetch tasks from dataview source: ", reason);

        set([]);
      });
    },
    [],
  );
}
