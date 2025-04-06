import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import { type LocalTask, type WithTime } from "../../../../task-types";
import type { PointerDateTime } from "../../../../types";
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
  [EditMode.SCHEDULE_SEARCH_RESULT]: drag,
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
  return tasks.slice().sort((a, b) => a.startTime.diff(b.startTime));
}

export function transform(
  baseline: LocalTask[],
  operation: EditOperation,
  settings: DayPlannerSettings,
  pointerDateTime: PointerDateTime,
) {
  const { dateTime } = pointerDateTime;
  const transformFn = transformers[operation.mode];

  isNotVoid(transformFn, `No transformer for operation: ${operation.mode}`);

  // todo: duplicated, task gets updated in transformer and here
  const indexOfEditedTask = baseline.findIndex(
    (task) => task.id === operation.task.id,
  );
  const isTaskInBaseline = indexOfEditedTask >= 0;

  let updatedTasks: LocalTask[];

  if (isTaskInBaseline) {
    const found = baseline[indexOfEditedTask];
    let taskWithCorrectDay = found;

    if (!isSingleDayMode(operation.mode)) {
      taskWithCorrectDay = {
        ...found,
        startTime: dateTime,
      };
    }

    updatedTasks = toSpliced(baseline, indexOfEditedTask, taskWithCorrectDay);
  } else {
    updatedTasks = baseline.concat({
      ...operation.task,
      startTime: minutesToMomentOfDay(
        getMinutesSinceMidnight(operation.task.startTime),
        dateTime,
      ),
    });
  }

  const withTimeSorted = sortByStartMinutes(updatedTasks);

  return transformFn(
    withTimeSorted,
    operation.task,
    getMinutesSinceMidnight(dateTime),
    settings,
    pointerDateTime,
  );
  // TODO: this is what's making timestamps appear in the wrong place
  //   .map((task) => ({ ...task, text: t.toString(task, operation.mode) }));
}
