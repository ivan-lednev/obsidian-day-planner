import type { PlacedTask } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";

export function resize(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const durationMinutes = cursorTime - editTarget.startMinutes;
  const updated = {
    ...editTarget,
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}

export function resizeFromTop(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const durationMinutes =
    editTarget.startMinutes + editTarget.durationMinutes - cursorTime;

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}
