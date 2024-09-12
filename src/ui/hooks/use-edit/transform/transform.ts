import { produce } from "immer";
import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import {
  type DayToTasks,
  isRemote,
  type LocalTask,
  type RemoteTask,
  type WithTime,
} from "../../../../task-types";
import { getDayKey, moveTaskToColumn } from "../../../../util/tasks-utils";
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

function sortByStartMinutes(tasks: WithTime<LocalTask>[]) {
  return produce(tasks, (draft) =>
    draft.sort((a, b) => a.startMinutes - b.startMinutes),
  );
}

export function transform(
  baseline: DayToTasks,
  cursorMinutes: number,
  operation: EditOperation,
  settings: DayPlannerSettings,
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

  isNotVoid(transformFn, `No transformer for operation: ${operation.mode}`);

  const readonly: Array<WithTime<RemoteTask>> = [];
  const editable: Array<WithTime<LocalTask>> = [];

  destTasks.withTime.forEach((task) => {
    if (isRemote(task)) {
      readonly.push(task);
    } else {
      editable.push(task);
    }
  });

  const withTimeSorted = sortByStartMinutes(editable);
  const transformed = transformFn(
    withTimeSorted,
    operation.task,
    cursorMinutes,
    settings,
  );
  const merged = [...readonly, ...transformed];

  return {
    ...withTaskInRightColumn,
    [destKey]: {
      ...destTasks,
      withTime: merged,
    },
  };
}
