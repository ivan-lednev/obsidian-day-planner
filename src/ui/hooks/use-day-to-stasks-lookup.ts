import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { getScheduledDay } from "../../service/dataview-facade";

interface UseDayToStasksLookupProps {
  dataviewTasks: Readable<DataArray<STask>>;
}

export function useDayToStasksLookup({
  dataviewTasks,
}: UseDayToStasksLookupProps) {
  return derived(dataviewTasks, ($dataviewTasks) => {
    if (!$dataviewTasks) {
      return {};
    }

    return Object.fromEntries(
      $dataviewTasks
        .groupBy(getScheduledDay)
        .map(({ key, rows }) => [key, rows.array()])
        .array(),
    );
  });
}
