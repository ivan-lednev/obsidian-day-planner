import type { LocalTask, WithTime } from "../../../../task-types";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const startMinutes = cursorTime;

  const updated = {
    ...editTarget,
    startMinutes,
  };

  return toSpliced(baseline, index, updated);
}
