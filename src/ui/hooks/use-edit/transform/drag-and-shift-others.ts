import { last } from "lodash";

import type { LocalTask, WithTime } from "../../../../task-types";
import { getEndMinutes } from "../../../../util/task-utils";

export function dragAndShiftOthers(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
  };

  const updatedFollowing = following.reduce<WithTime<LocalTask>[]>(
    (result, current) => {
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
    },
    [],
  );

  const updatedPreceding = preceding
    .reverse()
    .reduce<WithTime<LocalTask>[]>((result, current) => {
      const nextInTimeline = last(result) || updated;

      if (nextInTimeline.startMinutes < getEndMinutes(current)) {
        return [
          ...result,
          {
            ...current,
            startMinutes: nextInTimeline.startMinutes - current.durationMinutes,
          },
        ];
      }

      return [...result, current];
    }, [])
    .reverse();

  return [...updatedPreceding, updated, ...updatedFollowing];
}
