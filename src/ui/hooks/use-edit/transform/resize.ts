import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import { getEndMinutes } from "../../../../util/task-utils";
import { toSpliced } from "../../../../util/to-spliced";

export function resize(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
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
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
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
