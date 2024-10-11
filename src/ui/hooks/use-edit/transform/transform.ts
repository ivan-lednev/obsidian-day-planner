import { produce } from "immer";
import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import {
  type DayToTasks,
  isRemote,
  type LocalTask,
  type RemoteTask,
  type Task,
  type WithTime,
} from "../../../../task-types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
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

  const withTimeSorted = sortByStartMinutes(baseline);

  return transformFn(withTimeSorted, operation.task, cursorMinutes, settings);
}
