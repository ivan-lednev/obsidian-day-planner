import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { clockSeparator } from "../../constants";

interface UseActiveClocksProps {
  dataviewTasks: Readable<DataArray<STask>>;
}

function hasActiveClock(task: STask) {
  if (!task.clocked) {
    return false;
  }

  return !String(task.clocked).contains(clockSeparator);
}

export function useActiveClocks({ dataviewTasks }: UseActiveClocksProps) {
  return derived([dataviewTasks], ([$dataviewTasks]) => {
    return $dataviewTasks.where(hasActiveClock).array();
  });
}
