import type { LocalTask, WithTime } from "../../../../task-types";
import { minutesToMomentOfDay } from "../../../../util/moment";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const startMinutes = cursorTime;
  const startTime = minutesToMomentOfDay(cursorTime, editTarget.startTime);

  const updated = {
    ...editTarget,
    startMinutes,
    startTime,
  };

  return toSpliced(baseline, index, updated);
}
