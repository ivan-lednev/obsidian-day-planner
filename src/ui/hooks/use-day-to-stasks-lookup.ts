import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { getScheduledDay } from "../../service/dataview-facade";
import { arrToClockMoments } from "../../util/clock";
import { getDayKey } from "../../util/tasks-utils";

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

export function useClockDayToStasksLookup({
  dataviewTasks,
}: UseDayToStasksLookupProps) {
  return derived(dataviewTasks, ($dataviewTasks) => {
    if (!$dataviewTasks) {
      return {};
    }

    return Object.fromEntries(
      unwrap(
        $dataviewTasks
          .filter((sTask) => sTask.clocked)
          .flatMap((sTask) =>
            arrToClockMoments(sTask.clocked).map((moments) => ({
              sTask,
              moments,
            })),
          )
          .groupBy(({ moments: [start] }) => getDayKey(start)),
      ),
    );
  });
}

function unwrap<T>(group: ReturnType<DataArray<T>["groupBy"]>) {
  return group.map(({ key, rows }) => [key, rows.array()]).array();
}
