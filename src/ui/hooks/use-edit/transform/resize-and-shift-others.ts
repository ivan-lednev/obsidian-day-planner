import { last } from "lodash";

import type { PlacedPlanItem } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";

export function resizeAndShiftOthers(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = cursorTime - editTarget.startMinutes;

  const updated = {
    ...editTarget,
    durationMinutes,
  };

  const updatedFollowing = following.reduce((result, current) => {
    const previous = last(result) || updated;

    if (getEndMinutes(previous) > current.startMinutes) {
      return [
        ...result,
        {
          ...current,
          startMinutes: getEndMinutes(previous),
        },
      ];
    }

    return [...result, current];
  }, []);

  return [...preceding, updated, ...updatedFollowing];
}
