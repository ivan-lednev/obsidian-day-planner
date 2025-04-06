import { isNotVoid } from "typed-assert";

import type { LocalTask, WithTime } from "../../../../task-types";
import type { PointerDateTime } from "../../../../types";
import { minutesToMomentOfDay } from "../../../../util/moment";
import { toSpliced } from "../../../../util/to-spliced";

import type { DayPlannerSettings } from "src/settings";

export function drag(
  baseline: WithTime<LocalTask>[],
  editTarget: LocalTask,
  // todo: remove
  cursorTime: number,
  settings: DayPlannerSettings,
  pointerDateTime: PointerDateTime,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const task = baseline[index];

  isNotVoid(task);

  const updated = {
    ...task,
    isAllDayEvent: pointerDateTime.type === "date",
    startTime: minutesToMomentOfDay(cursorTime, task.startTime),
  };

  return toSpliced(baseline, index, updated);
}
