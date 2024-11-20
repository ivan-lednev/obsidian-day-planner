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
  return derived([dataviewSource, refreshSignal], ([$dataviewSource]) => {
    const noAdditionalSource = $dataviewSource.trim().length === 0;

    if (noAdditionalSource) {
      return [];
    }

    return dataviewFacade.getAllTasksFrom($dataviewSource);
  });
}
