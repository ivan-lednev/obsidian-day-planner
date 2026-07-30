import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import { type EditableTimeBlock } from "../../../../time-block-types";
import type { PointerDateTime } from "../../../../types";
import * as t from "../../../../util/time-block-utils";
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
  baseline: EditableTimeBlock[],
  operation: EditOperation,
  settings: DayPlannerSettings,
  pointerDateTime: PointerDateTime,
) {
  const result = baseline.slice();

  const isInBaseline = baseline.find(
    (timeBlock) => timeBlock.id === operation.timeBlock.id,
  );

  if (!isInBaseline) {
    result.push({
      ...operation.timeBlock,
      startTime: pointerDateTime.dateTime,
    });
  }

  const indexOfEditedTimeBlock = result.findIndex(
    (timeBlock) => timeBlock.id === operation.timeBlock.id,
  );

  if (pointerDateTime.type === "date") {
    return result.with(indexOfEditedTimeBlock, {
      ...operation.timeBlock,
      isAllDayEvent: true,
      startTime: pointerDateTime.dateTime,
      durationMinutes: 60,
    });
  }

  result[indexOfEditedTimeBlock] = {
    ...operation.timeBlock,
    isAllDayEvent: false,
  };

  const idToTimeBlockLookup = new Map(result.map((it) => [it.id, it]));

  const editableBlocks = result
    .map((it) => ({
      id: it.id,
      start: it.startTime.unix(),
      end: t.getEndTime(it).unix(),
    }))
    .toSorted((a, b) => a.start - b.start);

  const transformed = editBlocks(
    editableBlocks,
    operation.timeBlock.id,
    pointerDateTime.dateTime.unix(),
    getEditType(operation.mode),
    getEditInteraction(operation.mode),
    settings.minimalDurationMinutes * 60,
  );

  return transformed.map((it) => {
    const timeBlock = idToTimeBlockLookup.get(it.id);

    isNotVoid(timeBlock);

    return {
      ...timeBlock,
      startTime: window.moment.unix(it.start),
      durationMinutes: (it.end - it.start) / 60,
    };
  });
}
