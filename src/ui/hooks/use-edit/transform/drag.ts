import type { Task } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const startMinutes = cursorTime;

  const updated = {
    ...editTarget,
    startMinutes,
  };

  return toSpliced(baseline, index, updated);
}
