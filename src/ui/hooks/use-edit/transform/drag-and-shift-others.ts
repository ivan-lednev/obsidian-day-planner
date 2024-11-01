import { last } from "lodash";
import { isNotVoid } from "typed-assert";

import type { LocalTask, WithTime } from "../../../../task-types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
import { getEndMinutes } from "../../../../util/task-utils";

export function dragAndShiftOthers(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const task = baseline[index];

  isNotVoid(task);

  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const updated = {
    ...task,
    isAllDayEvent: false,
    startTime: minutesToMomentOfDay(cursorTime, task.startTime),
  };

  const updatedFollowing = following.reduce<WithTime<LocalTask>[]>(
    (result, current) => {
      const previous = last(result) || updated;

      if (
        getEndMinutes(previous) > getMinutesSinceMidnight(current.startTime)
      ) {
        return [
          ...result,
          {
            ...current,
            startTime: minutesToMomentOfDay(
              getEndMinutes(previous),
              current.startTime,
            ),
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

      if (
        getMinutesSinceMidnight(nextInTimeline.startTime) <
        getEndMinutes(current)
      ) {
        return [
          ...result,
          {
            ...current,
            startTime: minutesToMomentOfDay(
              getMinutesSinceMidnight(nextInTimeline.startTime) -
                current.durationMinutes,
              current.startTime,
            ),
          },
        ];
      }

      return [...result, current];
    }, [])
    .reverse();

  return [...updatedPreceding, updated, ...updatedFollowing];
}
