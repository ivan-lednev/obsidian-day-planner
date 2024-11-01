import { isNotVoid } from "typed-assert";

import type { LocalTask, WithTime } from "../../../../task-types";
import { minutesToMomentOfDay } from "../../../../util/moment";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const task = baseline[index];

  isNotVoid(task);

  const updated = {
    ...task,
    isAllDayEvent: false,
    startTime: minutesToMomentOfDay(cursorTime, task.startTime),
  };

  return toSpliced(baseline, index, updated);
}
