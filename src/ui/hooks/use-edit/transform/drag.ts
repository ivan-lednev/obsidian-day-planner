import type { LocalTask, WithTime } from "../../../../task-types";
import { minutesToMomentOfDay } from "../../../../util/moment";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const updated = {
    ...editTarget,
    startTime: minutesToMomentOfDay(cursorTime, editTarget.startTime),
  };

  return toSpliced(baseline, index, updated);
}
