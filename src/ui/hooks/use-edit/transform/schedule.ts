import { PlanItem, TasksForDay, UnscheduledPlanItem } from "../../../../types";

export function schedule(
  baseline: TasksForDay,
  editedTask: PlanItem,
  cursorTime: number,
): TasksForDay {
  const scheduledTask = {
    ...editedTask,
    startMinutes: cursorTime,
  };

  return {
    noTime: baseline.noTime.filter((task) => task.id !== editedTask.id),
    withTime: [...baseline.withTime, scheduledTask],
  };
}
