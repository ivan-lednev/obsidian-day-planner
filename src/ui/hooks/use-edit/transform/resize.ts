import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import type { PointerDateTime } from "../../../../types";
import { minutesToMomentOfDay } from "../../../../util/moment";
import { getEndMinutes } from "../../../../util/task-utils";
import { toSpliced } from "../../../../util/to-spliced";

import { getDurationMinutes } from "./util";

export function resize(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
  pointerDateTime?: PointerDateTime,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const task = baseline[index];

  isNotVoid(task);

  const updated = {
    ...task,
    durationMinutes: getDurationMinutes(
      task,
      cursorTime,
      settings,
      pointerDateTime?.dateTime,
    ),
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
  const task = baseline[index];

  isNotVoid(task);

  const durationMinutes = Math.max(
    getEndMinutes(task) - cursorTime,
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...task,
    startTime: minutesToMomentOfDay(cursorTime, task.startTime),
    durationMinutes,
  };

  return toSpliced(baseline, index, updated);
}
