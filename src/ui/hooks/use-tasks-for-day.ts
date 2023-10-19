import { Moment } from "moment";
import { DataArray, STask } from "obsidian-dataview";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { DayPlannerSettings } from "../../settings";
import { getTasksForDay } from "../../util/get-tasks-for-day";
import { PlacedPlanItem, PlanItem, UnscheduledPlanItem } from "../../types";

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
