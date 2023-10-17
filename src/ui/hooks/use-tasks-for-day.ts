import { Moment } from "moment";
import { DataArray, STask } from "obsidian-dataview";

import { addPlacing } from "../../overlap/overlap";
import { DayPlannerSettings } from "../../settings";
import { getTasksForDay } from "../../util/get-tasks-for-day";

interface UseTaskSourceProps {
  day: Moment;
  dataviewTasks: DataArray<STask>;
  settings: DayPlannerSettings;
}

export function useTasksForDay({
  day,
  dataviewTasks,
  settings,
}: UseTaskSourceProps) {
  if (dataviewTasks.length === 0) {
    return [];
  }

  const tasksForDay = getTasksForDay(day, dataviewTasks, { ...settings });

  return addPlacing(tasksForDay);
}
