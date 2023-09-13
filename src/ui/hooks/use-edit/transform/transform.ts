import { last } from "lodash";

import type { PlacedPlanItem } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";
import { Edit, EditMode } from "../types";


export function transform(
  baseline: PlacedPlanItem[],
  cursorTime: number,
  { taskId, mode }: Edit,
) {
  const editTarget = baseline.find((task) => task.id === taskId);

  switch (mode) {
    case EditMode.DRAG:
      return drag(baseline, editTarget, cursorTime);
    case EditMode.DRAG_AND_SHIFT_OTHERS:
      return dragAndShiftOthers(baseline, editTarget, cursorTime);
    default:
      throw new Error(`Unknown edit mode: ${mode}`);
  }
}

function drag(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const startMinutes = cursorTime;
  const endMinutes = cursorTime + editTarget.durationMinutes;

  const updated = {
    ...editTarget,
    startMinutes,
    endMinutes,
  };

  return toSpliced(baseline, index, updated);
}

function dragAndShiftOthers(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const precedingItems = baseline.slice(0, index);

  const newStartMinutes = cursorTime;
  const newEndMinutes = cursorTime + editTarget.durationMinutes;

  const updated = {
    ...editTarget,
    startMinutes: newStartMinutes,
    endMinutes: newEndMinutes,
  };

  const followingWithCurrent = baseline.slice(index + 1).reduce(
    (result, current) => {
      const previous = last(result);

      if (previous.endMinutes > current.startMinutes) {
        // todo: this is duplicated. Use "shift time" or use getter for endMinutes
        result.push({
          ...current,
          startMinutes: previous.endMinutes,
          endMinutes: previous.endMinutes + current.durationMinutes,
        });
      } else {
        result.push(current);
      }

      return result;
    },
    [updated],
  );

  return [...precedingItems, ...followingWithCurrent];
}
