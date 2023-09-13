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
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const newStartMinutes = cursorTime;
  const newEndMinutes = cursorTime + editTarget.durationMinutes;

  const updated = {
    ...editTarget,
    startMinutes: newStartMinutes,
    endMinutes: newEndMinutes,
  };

  const updatedFollowing = following.reduce((result, current) => {
    const previous = last(result) || updated;

    if (previous.endMinutes > current.startMinutes) {
      result.push({
        ...current,
        startMinutes: previous.endMinutes,
        endMinutes: previous.endMinutes + current.durationMinutes,
      });
    } else {
      result.push(current);
    }

    return result;
  }, []);

  const updatedPreceding = preceding
    .reverse()
    .reduce((result, current) => {
      // todo: this is confusing: it's previous in array, but later in timeline
      const nextInTimeline = last(result) || updated;

      // todo: this is a mirror of the previous one. We need to join them
      if (nextInTimeline.startMinutes < current.endMinutes) {
        result.push({
          ...current,
          startMinutes: nextInTimeline.startMinutes - current.durationMinutes,
          endMinutes: nextInTimeline.startMinutes,
        });
      } else {
        result.push(current);
      }

      return result;
    }, [])
    .reverse();

  return [...updatedPreceding, updated, ...updatedFollowing];
}
