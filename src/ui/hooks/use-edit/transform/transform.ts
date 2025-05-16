import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import { type LocalTask } from "../../../../task-types";
import type { PointerDateTime } from "../../../../types";
import * as t from "../../../../util/task-utils";
import { EditMode, type EditOperation } from "../types";

import { editBlocks } from "./edit-blocks";

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
  const result = baseline.slice();

  const isInBaseline = baseline.find((task) => task.id === operation.task.id);

  if (!isInBaseline) {
    result.push({
      ...operation.task,
      startTime: pointerDateTime.dateTime,
    });
  }

  const indexOfEditedTask = result.findIndex(
    (task) => task.id === operation.task.id,
  );

  if (pointerDateTime.type === "date") {
    return result.with(indexOfEditedTask, {
      ...operation.task,
      isAllDayEvent: true,
      startTime: pointerDateTime.dateTime,
      durationMinutes: 60,
    });
  }

  result[indexOfEditedTask] = {
    ...operation.task,
    isAllDayEvent: false,
  };

  const idToTaskLookup = new Map(result.map((it) => [it.id, it]));

  const editableBlocks = result
    .map((it) => ({
      id: it.id,
      start: it.startTime.unix(),
      end: t.getEndTime(it).unix(),
    }))
    .toSorted((a, b) => a.start - b.start);

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
    };
  });
}
