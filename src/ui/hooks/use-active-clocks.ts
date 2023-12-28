import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { hasActiveClockProp } from "../../util/clock";

interface UseActiveClocksProps {
  dataviewTasks: Readable<DataArray<STask>>;
}

export function useActiveClocks({ dataviewTasks }: UseActiveClocksProps) {
  return derived([dataviewTasks], ([$dataviewTasks]) => {
    return $dataviewTasks.where(hasActiveClockProp).array();
  });
}
