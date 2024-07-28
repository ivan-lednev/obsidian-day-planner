import { last } from "lodash";

import type { Task } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";

export function resizeAndShiftOthers(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
): Task[] {
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

export function resizeFromTopAndShiftOthers(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes =
    editTarget.startMinutes + editTarget.durationMinutes - cursorTime;

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
    durationMinutes,
  };

  const updatedPreceding = preceding
    .reverse()
    .reduce((result, current) => {
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

  return [...updatedPreceding, updated, ...following];
}
