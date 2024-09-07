import type { DayPlannerSettings } from "../../../../settings";
import type { Task } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";
import { toSpliced } from "../../../../util/to-spliced";

export function resize(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
  settings: DayPlannerSettings,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const durationMinutes = Math.max(
    cursorTime - editTarget.startMinutes,
    settings.minimalDurationMinutes,
  );
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
  settings: DayPlannerSettings,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const durationMinutes = Math.max(
    getEndMinutes(editTarget) - cursorTime,
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}
