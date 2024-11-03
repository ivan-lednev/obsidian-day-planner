import { produce } from "immer";
import type { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import { type LocalTask, type WithTime } from "../../../../task-types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
import { toSpliced } from "../../../../util/to-spliced";
import { EditMode, type EditOperation, type TaskTransformer } from "../types";

import { create } from "./create";
import { drag } from "./drag";
import { dragAndShiftOthers } from "./drag-and-shift-others";
import { dragAndShrinkOthers } from "./drag-and-shrink-others";
import { resize, resizeFromTop } from "./resize";
import {
  resizeAndShiftOthers,
  resizeFromTopAndShiftOthers,
} from "./resize-and-shift-others";
import {
  resizeAndShrinkOthers,
  resizeFromTopAndShrinkOthers,
} from "./resize-and-shrink-others";

const transformers: Record<EditMode, TaskTransformer> = {
  [EditMode.DRAG]: drag,
  [EditMode.DRAG_AND_SHIFT_OTHERS]: dragAndShiftOthers,
  [EditMode.DRAG_AND_SHRINK_OTHERS]: dragAndShrinkOthers,
  [EditMode.CREATE]: create,
  [EditMode.RESIZE]: resize,
  [EditMode.RESIZE_AND_SHIFT_OTHERS]: resizeAndShiftOthers,
  [EditMode.RESIZE_FROM_TOP]: resizeFromTop,
  [EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS]: resizeFromTopAndShiftOthers,
  [EditMode.RESIZE_AND_SHRINK_OTHERS]: resizeAndShrinkOthers,
  [EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS]: resizeFromTopAndShrinkOthers,
};

function isSingleDayMode(mode: EditMode) {
  return [
    EditMode.RESIZE,
    EditMode.RESIZE_FROM_TOP,
    EditMode.RESIZE_AND_SHRINK_OTHERS,
    EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS,
    EditMode.RESIZE_AND_SHIFT_OTHERS,
    EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS,
  ].includes(mode);
}

function sortByStartMinutes(tasks: WithTime<LocalTask>[]) {
  return produce(tasks, (draft) =>
    draft.sort((a, b) => a.startTime.diff(b.startTime)),
  );
}

export function transform(
  baseline: LocalTask[],
  operation: EditOperation,
  settings: DayPlannerSettings,
  pointerDateTime: { dateTime?: Moment; type?: "dateTime" | "date" },
) {
  const dateTime = pointerDateTime.dateTime;

  if (!dateTime) {
    throw new Error("DateTime cannot be undefined on edit");
  }

  const transformFn = transformers[operation.mode];

  isNotVoid(transformFn, `No transformer for operation: ${operation.mode}`);

  // todo: duplicated, task gets updated in transformer, in onMouseEnter, and here
  const index = baseline.findIndex((task) => task.id === operation.task.id);
  const isInBaseline = index >= 0;

  let taskWithUpdatedDay = operation.task;
  let withUpdatedDay = baseline.concat(operation.task);

  if (isInBaseline) {
    const found = baseline[index];
    taskWithUpdatedDay = found;

    if (!isSingleDayMode(operation.mode)) {
      taskWithUpdatedDay = {
        ...found,
        startTime: minutesToMomentOfDay(
          getMinutesSinceMidnight(found.startTime),
          dateTime,
        ),
      };
    }

    withUpdatedDay = toSpliced(baseline, index, taskWithUpdatedDay);
  }

  const withTimeSorted = sortByStartMinutes(withUpdatedDay);

  // todo: cursor time should be a moment
  return transformFn(
    withTimeSorted,
    operation.task,
    getMinutesSinceMidnight(dateTime),
    settings,
    dateTime,
  );
}
