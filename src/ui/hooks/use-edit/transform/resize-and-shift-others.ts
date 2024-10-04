import { last } from "lodash";

import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
import { getEndMinutes } from "../../../../util/task-utils";

export function resizeAndShiftOthers(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = Math.max(
    cursorTime - getMinutesSinceMidnight(editTarget.startTime),
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...editTarget,
    durationMinutes,
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

  return [...preceding, updated, ...updatedFollowing];
}

export function resizeFromTopAndShiftOthers(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = Math.max(
    getEndMinutes(editTarget) - cursorTime,
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...editTarget,
    startTime: minutesToMomentOfDay(cursorTime, editTarget.startTime),
    durationMinutes,
  };

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

  return [...updatedPreceding, updated, ...following];
}
