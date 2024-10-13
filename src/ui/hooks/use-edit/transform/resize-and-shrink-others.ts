import { last } from "lodash";
import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
import { getEndMinutes } from "../../../../util/task-utils";

export function resizeAndShrinkOthers(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const task = baseline[index];

  isNotVoid(task);

  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = Math.max(
    cursorTime - getMinutesSinceMidnight(task.startTime),
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...task,
    durationMinutes,
  };

  const updatedFollowing = following.reduce<WithTime<LocalTask>[]>(
    (result, current) => {
      const previous = last(result) || updated;
      const currentNeedsToShrink =
        getEndMinutes(previous) > getMinutesSinceMidnight(current.startTime);

      if (currentNeedsToShrink) {
        const newCurrentStartMinutes = getEndMinutes(previous);
        const newCurrentDurationMinutes =
          getEndMinutes(current) - newCurrentStartMinutes;

        return [
          ...result,
          {
            ...current,
            startTime: minutesToMomentOfDay(
              newCurrentStartMinutes,
              current.startTime,
            ),
            durationMinutes: Math.max(
              newCurrentDurationMinutes,
              settings.minimalDurationMinutes,
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

export function resizeFromTopAndShrinkOthers(
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask>[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const task = baseline[index];

  isNotVoid(task);

  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = Math.max(
    getEndMinutes(task) - cursorTime,
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...task,
    startTime: minutesToMomentOfDay(cursorTime, task.startTime),
    durationMinutes,
  };

  const updatedPreceding = preceding
    .reverse()
    .reduce<WithTime<LocalTask>[]>((result, current) => {
      const nextInTimeline = last(result) || updated;
      const currentNeedsToShrink =
        getMinutesSinceMidnight(nextInTimeline.startTime) <
        getEndMinutes(current);

      if (currentNeedsToShrink) {
        const currentNeedsToMove =
          getMinutesSinceMidnight(nextInTimeline.startTime) -
            getMinutesSinceMidnight(current.startTime) <
          settings.minimalDurationMinutes;

        const newCurrentStartMinutes = currentNeedsToMove
          ? getMinutesSinceMidnight(nextInTimeline.startTime) -
            settings.minimalDurationMinutes
          : getMinutesSinceMidnight(current.startTime);

        return [
          ...result,
          {
            ...current,
            startTime: minutesToMomentOfDay(
              newCurrentStartMinutes,
              current.startTime,
            ),
            durationMinutes:
              getMinutesSinceMidnight(nextInTimeline.startTime) -
              newCurrentStartMinutes,
          },
        ];
      }

      return [...result, current];
    }, [])
    .reverse();

  return [...updatedPreceding, updated, ...following];
}
