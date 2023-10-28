import type { PlacedTask } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const startMinutes = cursorTime;

  const updated = {
    ...editTarget,
    startMinutes,
  };

  return toSpliced(baseline, index, updated);
}
