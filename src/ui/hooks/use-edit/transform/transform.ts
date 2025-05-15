import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import { type LocalTask } from "../../../../task-types";
import type { PointerDateTime } from "../../../../types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
import * as t from "../../../../util/task-utils";
import { EditMode, type EditOperation } from "../types";

import { editBlocks } from "./edit-blocks";

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

function getEditType(mode: EditMode) {
  if (
    mode === EditMode.DRAG ||
    mode === EditMode.DRAG_AND_SHIFT_OTHERS ||
    mode === EditMode.DRAG_AND_SHRINK_OTHERS
  ) {
    return "move";
  }

  if (
    mode === EditMode.CREATE ||
    mode === EditMode.RESIZE ||
    mode === EditMode.RESIZE_AND_SHIFT_OTHERS ||
    mode === EditMode.RESIZE_AND_SHRINK_OTHERS
  ) {
    return "end";
  }

  return "start";
}

function getEditInteraction(mode: EditMode) {
  if (
    mode === EditMode.DRAG_AND_SHRINK_OTHERS ||
    mode === EditMode.RESIZE_AND_SHRINK_OTHERS ||
    mode === EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS
  ) {
    return "shrink";
  }

  if (
    mode === EditMode.DRAG_AND_SHIFT_OTHERS ||
    mode === EditMode.RESIZE_AND_SHIFT_OTHERS ||
    mode === EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS
  ) {
    return "push";
  }

  return "none";
}

export function transform(
  baseline: LocalTask[],
  operation: EditOperation,
  settings: DayPlannerSettings,
  pointerDateTime: PointerDateTime,
) {
  // todo: duplicated, task gets updated in transformer and here
  let indexOfEditedTask = baseline.findIndex(
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
        startTime: pointerDateTime.dateTime,
      };
    }

    updatedTasks = baseline.with(indexOfEditedTask, taskWithCorrectDay);
  } else {
    updatedTasks = baseline.concat({
      ...operation.task,
      isAllDayEvent: pointerDateTime.type === "date",
      startTime: minutesToMomentOfDay(
        getMinutesSinceMidnight(operation.task.startTime),
        pointerDateTime.dateTime,
      ),
    });
    indexOfEditedTask = updatedTasks.length - 1;
  }

  if (pointerDateTime.type === "date") {
    if (indexOfEditedTask === -1) {
      throw new Error("Task not found");
    }

    return updatedTasks.with(indexOfEditedTask, {
      ...operation.task,
      isAllDayEvent: true,
      startTime: pointerDateTime.dateTime,
      durationMinutes: 60,
    });
  }

  const idToTaskLookup = new Map(updatedTasks.map((it) => [it.id, it]));

  const editableBlocks = updatedTasks
    .map((it) => ({
      id: it.id,
      start: it.startTime.unix(),
      end: t.getEndTime(it).unix(),
    }))
    .toSorted((a, b) => a.start - b.start);

  // TODO: use object

  const transformed = editBlocks(
    editableBlocks,
    operation.task.id,
    pointerDateTime.dateTime.unix(),
    getEditType(operation.mode),
    getEditInteraction(operation.mode),
    settings.minimalDurationMinutes * 60,
  );

  return transformed.map((it) => {
    const task = idToTaskLookup.get(it.id);

    isNotVoid(task);

    return {
      ...task,
      startTime: window.moment.unix(it.start),
      durationMinutes: (it.end - it.start) / 60,
      isAllDayEvent: false,
    };
  });
  // TODO: this is what's making timestamps appear in the wrong place
  //   .map((task) => ({ ...task, text: t.toString(task, operation.mode) }));
}
