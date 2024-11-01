import { last } from "lodash";
import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../../../../settings";
import type { LocalTask, WithTime } from "../../../../task-types";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../../util/moment";
import { getEndMinutes } from "../../../../util/task-utils";

export function dragAndShrinkOthers(
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

  const updated = {
    ...task,
    isAllDayEvent: false,
    startTime: minutesToMomentOfDay(cursorTime, task.startTime),
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

  return [...updatedPreceding, updated, ...updatedFollowing];
}
