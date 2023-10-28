import { Moment } from "moment";
import { DataArray, STask } from "obsidian-dataview";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { DayPlannerSettings } from "../../settings";
import { TasksForDay } from "../../types";
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
}: UseTaskSourceProps): TasksForDay {
  const { withTime, noTime } = getTasksForDay(day, dataviewTasks, settings);

  return { withTime: addHorizontalPlacing(withTime), noTime };
}
