import { produce } from "immer";
import { isNotVoid } from "typed-assert";

import type { Task, Tasks } from "../../../../types";
import { getDayKey, moveTaskToColumn } from "../../../../util/tasks-utils";
import { EditMode, EditOperation } from "../types";

import { create } from "./create";
import { drag } from "./drag";
import { dragAndShiftOthers } from "./drag-and-shift-others";
import { resize } from "./resize";
import { resizeAndShiftOthers } from "./resize-and-shift-others";

const transformers: Record<EditMode, typeof drag> = {
  [EditMode.DRAG]: drag,
  [EditMode.DRAG_AND_SHIFT_OTHERS]: dragAndShiftOthers,
  [EditMode.CREATE]: create,
  [EditMode.RESIZE]: resize,
  [EditMode.RESIZE_AND_SHIFT_OTHERS]: resizeAndShiftOthers,
};

const multidayModes: Partial<EditMode[]> = [
  EditMode.DRAG,
  EditMode.DRAG_AND_SHIFT_OTHERS,
];

function isMultiday(mode: EditMode) {
  return multidayModes.includes(mode);
}

function getDestDay(operation: EditOperation) {
  return isMultiday(operation.mode) ? operation.day : operation.task.startTime;
}

function sortByStartMinutes(tasks: Task[]) {
  return produce(tasks, (draft) =>
    draft.sort((a, b) => a.startMinutes - b.startMinutes),
  );
}

export function transform(
  baseline: Tasks,
  cursorMinutes: number,
  operation: EditOperation,
) {
  const destDay = getDestDay(operation);
  const destKey = getDayKey(destDay);

  const withTaskInRightColumn = moveTaskToColumn(
    destDay,
    operation.task,
    baseline,
  );

  const destTasks = withTaskInRightColumn[destKey];
  const transformFn = transformers[operation.mode];
  const withTimeSorted = sortByStartMinutes(destTasks.withTime);

  isNotVoid(transformFn, `No transformer for operation: ${operation.mode}`);

  return {
    ...withTaskInRightColumn,
    [destKey]: {
      ...destTasks,
      withTime: transformFn(withTimeSorted, operation.task, cursorMinutes),
    },
  };
}
