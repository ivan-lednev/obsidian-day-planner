import type { Task } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";
import { toSpliced } from "../../../../util/to-spliced";

export function resize(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const durationMinutes = cursorTime - editTarget.startMinutes;
  const updated = {
    ...editTarget,
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}

export function resizeFromTop(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const durationMinutes = getEndMinutes(editTarget) - cursorTime;

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}
