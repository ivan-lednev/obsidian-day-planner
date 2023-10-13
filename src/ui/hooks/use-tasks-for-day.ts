import { Moment } from "moment";
import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { addPlacing } from "../../overlap/overlap";
import { getTasksForDay } from "../../util/get-tasks-for-day";

interface UseTaskSourceProps {
  day: Readable<Moment>;
  dataviewTasks: Readable<DataArray<STask>>;
}

export function useTasksForDay({ day, dataviewTasks }: UseTaskSourceProps) {
  return derived([day, dataviewTasks], ([$day, $dataviewTasks]) => {
    if ($dataviewTasks.length === 0) {
      return [];
    }

    const tasksForDay = getTasksForDay($day, $dataviewTasks);

    return addPlacing(tasksForDay);
  });
}
