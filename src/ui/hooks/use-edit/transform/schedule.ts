import { Task, TasksForDay } from "../../../../types";

export function schedule(
  baseline: TasksForDay,
  editedTask: Task,
  cursorTime: number,
): TasksForDay {
  const scheduledTask = {
    ...editedTask,
    startMinutes: cursorTime,
    isGhost: true,
  };

  return {
    noTime: baseline.noTime.filter((task) => task.id !== editedTask.id),
    withTime: [...baseline.withTime, scheduledTask],
  };
}
