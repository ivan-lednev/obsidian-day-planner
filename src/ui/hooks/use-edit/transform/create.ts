import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import { getMinutesSinceMidnight } from "../../../../util/moment";

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
          cursorTime - getMinutesSinceMidnight(editTarget.startTime),
          settings.minimalDurationMinutes,
        ),
      };
    }

    return task;
  });
}
