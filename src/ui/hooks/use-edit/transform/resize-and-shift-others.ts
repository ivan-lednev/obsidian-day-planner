import { last } from "lodash";

import type { PlacedPlanItem } from "../../../../types";

export function resizeAndShiftOthers(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const endMinutes = cursorTime;
  const durationMinutes = endMinutes - editTarget.startMinutes;

  const updated = {
    ...editTarget,
    durationMinutes,
    endMinutes,
  };

  // todo: this is copy-pasted
  const updatedFollowing = following.reduce((result, current) => {
    const previous = last(result) || updated;

    if (previous.endMinutes > current.startMinutes) {
      return [
        ...result,
        {
          ...current,
          startMinutes: previous.endMinutes,
          endMinutes: previous.endMinutes + current.durationMinutes,
        },
      ];
    }

    return [...result, current];
  }, []);

  return [...preceding, updated, ...updatedFollowing];
}
