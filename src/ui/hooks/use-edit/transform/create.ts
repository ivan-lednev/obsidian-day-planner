import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import { getMinutesSinceMidnight } from "../../../../util/moment";

export function create(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
  // todo: unify approach
  return baseline.map((task) => {
    return task.id === editTarget.id
      ? {
          ...task,
          durationMinutes: Math.max(
            cursorTime - getMinutesSinceMidnight(task.startTime),
            settings.minimalDurationMinutes,
          ),
        }
      : task;
  });
}
