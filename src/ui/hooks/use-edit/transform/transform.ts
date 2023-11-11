import { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import type {
  CursorPos,
  Task,
  Tasks,
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
