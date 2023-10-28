import type { PlacedTask } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";

export function resize(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  // todo: don't pass the index, do this outside
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const durationMinutes = cursorTime - editTarget.startMinutes;

  const updated = {
    ...editTarget,
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}
