import { Moment } from "moment";
import { DataArray, STask } from "obsidian-dataview";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { DayPlannerSettings } from "../../settings";
import { PlanItem } from "../../types";
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
}: UseTaskSourceProps): {
  scheduled: PlanItem[];
  unscheduled: PlanItem[];
} {
  const { scheduled, unscheduled } = getTasksForDay(day, dataviewTasks, {
    ...settings,
  });

  return { scheduled: addHorizontalPlacing(scheduled), unscheduled };
}
