import type {
  CursorPos,
  PlacedTask,
  Tasks,
  TasksForDay,
} from "../../../../types";
import { EditMode, EditOperation } from "../types";

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

const transformers: Record<EditMode, typeof drag> = {
  [EditMode.DRAG]: drag,
  [EditMode.DRAG_AND_SHIFT_OTHERS]: dragAndShiftOthers,
};

export function transform_MULTIDAY(
  baseline: Tasks,
  cursorPos: CursorPos,
  operation: EditOperation,
) {
  const moved = moveTaskToDay(baseline, operation.task, cursorPos.day);

  const destKey = getDayKey(cursorPos.day);
  const destTasks = moved[destKey];

  const transformFn = transformers[operation.mode];

  return {
    ...moved,
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
