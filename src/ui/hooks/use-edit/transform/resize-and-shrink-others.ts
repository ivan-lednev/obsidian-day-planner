import { last } from "lodash";

import type { DayPlannerSettings } from "../../../../settings";
import type { Task } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";

export function resizeAndShrinkOthers(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
  settings: DayPlannerSettings,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = Math.max(
    cursorTime - editTarget.startMinutes,
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...editTarget,
    durationMinutes,
  };

  const updatedFollowing = following.reduce<Task[]>((result, current) => {
    const previous = last(result) || updated;
    const currentNeedsToShrink = getEndMinutes(previous) > current.startMinutes;

    if (currentNeedsToShrink) {
      const newCurrentStartMinutes = getEndMinutes(previous);
      const newCurrentDurationMinutes =
        getEndMinutes(current) - newCurrentStartMinutes;

      return [
        ...result,
        {
          ...current,
          startMinutes: newCurrentStartMinutes,
          durationMinutes: Math.max(
            newCurrentDurationMinutes,
            settings.minimalDurationMinutes,
          ),
        },
      ];
    }

    return [...result, current];
  }, []);

  return [...preceding, updated, ...updatedFollowing];
}

export function resizeFromTopAndShrinkOthers(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
  settings: DayPlannerSettings,
): Task[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const durationMinutes = Math.max(
    getEndMinutes(editTarget) - cursorTime,
    settings.minimalDurationMinutes,
  );

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
    durationMinutes,
  };

  const updatedPreceding = preceding
    .reverse()
    .reduce<Task[]>((result, current) => {
      const nextInTimeline = last(result) || updated;
      const currentNeedsToShrink =
        nextInTimeline.startMinutes < getEndMinutes(current);

      if (currentNeedsToShrink) {
        const currentNeedsToMove =
          nextInTimeline.startMinutes - current.startMinutes <
          settings.minimalDurationMinutes;

        const newCurrentStartMinutes = currentNeedsToMove
          ? nextInTimeline.startMinutes - settings.minimalDurationMinutes
          : current.startMinutes;

        return [
          ...result,
          {
            ...current,
            startMinutes: newCurrentStartMinutes,
            durationMinutes:
              nextInTimeline.startMinutes - newCurrentStartMinutes,
          },
        ];
      }

      return [...result, current];
    }, [])
    .reverse();

  return [...updatedPreceding, updated, ...following];
}
