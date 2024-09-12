import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";

export function create(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
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
