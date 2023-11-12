import { isNotVoid } from "typed-assert";

import type { Tasks } from "../../../../types";
import { moveTaskToColumn } from "../../../../util/tasks-utils";
import { EditMode, EditOperation } from "../types";

import { create } from "./create";
import { drag } from "./drag";
import { dragAndShiftOthers, getDayKey } from "./drag-and-shift-others";

const transformers: Partial<Record<EditMode, typeof drag>> = {
  [EditMode.DRAG]: drag,
  [EditMode.DRAG_AND_SHIFT_OTHERS]: dragAndShiftOthers,
  [EditMode.CREATE]: create,
};

export function transform(
  baseline: Tasks,
  cursorMinutes: number,
  operation: EditOperation,
) {
  const withTaskInRightColumn = moveTaskToColumn(
    operation.day,
    operation.task,
    baseline,
  );

  const destKey = getDayKey(operation.day);
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
        cursorMinutes,
      ),
    },
  };
}
