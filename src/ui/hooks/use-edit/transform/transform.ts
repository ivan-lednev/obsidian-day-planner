import { produce } from "immer";
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
  [EditMode.CREATE]: create,
  [EditMode.RESIZE]: resize,
  [EditMode.RESIZE_AND_SHIFT_OTHERS]: resizeAndShiftOthers,
  [EditMode.RESIZE_FROM_TOP]: resizeFromTop,
  [EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS]: resizeFromTopAndShiftOthers,
  [EditMode.DRAG_AND_SHRINK_OTHERS]: dragAndShrinkOthers,
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
  cursorMinutes: number,
  operation: EditOperation,
  settings: DayPlannerSettings,
) {
  const transformFn = transformers[operation.mode];

  isNotVoid(transformFn, `No transformer for operation: ${operation.mode}`);

  // todo: duplicated, task gets updated in transformer, in onMouseEnter, and here
  const index = baseline.findIndex((task) => task.id === operation.task.id);

  const taskWithUpdatedDay = isSingleDayMode(operation.mode)
    ? operation.task
    : {
        ...operation.task,
        startTime: minutesToMomentOfDay(
          getMinutesSinceMidnight(operation.task.startTime),
          operation.day,
        ),
      };

  const withUpdatedDay =
    index === -1
      ? baseline.concat(taskWithUpdatedDay)
      : toSpliced(baseline, index, taskWithUpdatedDay);

  const withTimeSorted = sortByStartMinutes(withUpdatedDay);

  return transformFn(withTimeSorted, operation.task, cursorMinutes, settings);
}
