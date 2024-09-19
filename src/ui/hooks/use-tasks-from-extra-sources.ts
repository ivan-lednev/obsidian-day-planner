import { TFile } from "obsidian";
import { derived, get, type Readable } from "svelte/store";

import { DataviewFacade } from "../../service/dataview-facade";
import * as query from "../../util/dataview-query";

interface UseTasksFromExtraSourcesProps {
  dataviewSource: Readable<string>;
  debouncedTaskUpdateTrigger: Readable<unknown>;
  visibleDailyNotes: Readable<TFile[]>;
  dataviewFacade: DataviewFacade;
}

export function useTasksFromExtraSources({
  dataviewSource,
  debouncedTaskUpdateTrigger,
  visibleDailyNotes,
  dataviewFacade,
}: UseTasksFromExtraSourcesProps) {
  return derived(
    [dataviewSource, debouncedTaskUpdateTrigger],
    ([$dataviewSource]) => {
      const noAdditionalSource = $dataviewSource.trim().length === 0;

      if (noAdditionalSource) {
        return [];
      }

      const queryFromExtraSources = query.andNot(
        $dataviewSource,
        query.anyOf(get(visibleDailyNotes)),
      );

      return dataviewFacade.getAllTasksFrom(queryFromExtraSources);
    },
  );
}
