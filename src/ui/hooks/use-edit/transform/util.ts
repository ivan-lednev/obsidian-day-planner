import type { Moment } from "moment";

import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask } from "../../../../task-types";
import { getMinutesSinceMidnight } from "../../../../util/moment";

export function getDurationMinutes(
  task: LocalTask,
  cursorTime: number,
  settings: DayPlannerSettings,
  newDay?: Moment,
) {
  if (newDay) {
    return Math.max(
      newDay
        .clone()
        .startOf("day")
        .add(cursorTime, "minutes")
        .diff(task.startTime, "minutes"),
      settings.minimalDurationMinutes,
    );
  }

  return Math.max(
    cursorTime - getMinutesSinceMidnight(task.startTime),
    settings.minimalDurationMinutes,
  );
}
