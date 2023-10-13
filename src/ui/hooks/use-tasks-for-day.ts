import { Moment } from "moment";
import { DataArray, STask } from "obsidian-dataview";

import { addPlacing } from "../../overlap/overlap";
import { getTasksForDay } from "../../util/get-tasks-for-day";

interface UseTaskSourceProps {
  day: Moment;
  dataviewTasks: DataArray<STask>;
}

export function useTasksForDay({ day, dataviewTasks }: UseTaskSourceProps) {
  if (dataviewTasks.length === 0) {
    return [];
  }

  const tasksForDay = getTasksForDay(day, dataviewTasks);

  return addPlacing(tasksForDay);
}
