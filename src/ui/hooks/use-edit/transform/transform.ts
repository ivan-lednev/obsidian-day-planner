import { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import type {
  CursorPos,
  PlacedTask,
  Task,
  Tasks,
  TasksForDay,
} from "../../../../types";
import { EditMode, EditOperation } from "../types";
import { moveToTimed } from "../use-displayed-tasks";

import { create } from "./create";
import { drag } from "./drag";
import {
  dragAndShiftOthers,
  getDayKey,
  moveTaskToDay,
} from "./drag-and-shift-others";
import { resize } from "./resize";
import { resizeAndShiftOthers } from "./resize-and-shift-others";
import { schedule } from "./schedule";

const transformers: Partial<Record<EditMode, typeof drag>> = {
  [EditMode.DRAG]: drag,
  [EditMode.DRAG_AND_SHIFT_OTHERS]: dragAndShiftOthers,
  [EditMode.CREATE]: create,
};

function moveTaskToColumn(day: Moment, task: Task, baseline: Tasks) {
  if (day.isSame(task.startTime, "day")) {
    const key = getDayKey(task.startTime);

    return {
      ...baseline,
      [key]: moveToTimed(task, baseline[key]),
    };
  }

  return moveTaskToDay(baseline, task, day);
}

export function transform_MULTIDAY(
  baseline: Tasks,
  cursorPos: CursorPos,
  operation: EditOperation,
) {
  const withTaskInRightColumn = moveTaskToColumn(
    cursorPos.day,
    operation.task,
    baseline,
  );

  const destKey = getDayKey(cursorPos.day);
  const destTasks = withTaskInRightColumn[destKey];

  const transformFn = transformers[operation.mode];

  isNotVoid(transformFn, `No transformer for operation: ${operation.mode}`);

  return {
    ...withTaskInRightColumn,
    [destKey]: {
      ...destTasks,
      withTime: transformFn(
        destTasks.withTime.sort((a, b) => a.startMinutes - b.startMinutes),
        operation.task,
        cursorPos.minutes,
      ),
    },
  };
}

export function transform(
  baseline: TasksForDay,
  cursorTime: number,
  { task, mode }: EditOperation,
) {
  switch (mode) {
    case EditMode.SCHEDULE:
      return schedule(baseline, task, cursorTime);
    default:
      return {
        ...baseline,
        withTime: transformTasksWithTime(baseline.withTime, cursorTime, {
          task,
          mode,
        }),
      };
  }
}

export function transformTasksWithTime(
  baseline: PlacedTask[],
  cursorTime: number,
  { task, mode }: EditOperation,
) {
  switch (mode) {
    case EditMode.DRAG:
      return drag(baseline, task, cursorTime);
    case EditMode.DRAG_AND_SHIFT_OTHERS:
      return dragAndShiftOthers(baseline, task, cursorTime);
    case EditMode.CREATE:
      return create(baseline, task, cursorTime);
    case EditMode.RESIZE:
      return resize(baseline, task, cursorTime);
    case EditMode.RESIZE_AND_SHIFT_OTHERS:
      return resizeAndShiftOthers(baseline, task, cursorTime);
    default:
      throw new Error(`Unknown edit mode: ${mode}`);
  }
}
