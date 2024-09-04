import { DayPlannerSettings } from "../../../../settings";
import type { Task } from "../../../../types";

export function create(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
  settings: DayPlannerSettings,
): Task[] {
  return baseline.map((task) => {
    if (task.id === editTarget.id) {
      return {
        ...editTarget,
        durationMinutes: Math.max(
          cursorTime - editTarget.startMinutes,
          settings.minimalDurationMinutes,
        ),
      };
    }

    return task;
  });
}
