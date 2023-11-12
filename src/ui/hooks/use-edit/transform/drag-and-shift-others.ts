import { last } from "lodash";
import { Moment } from "moment";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";

import type { PlacedTask, Task } from "../../../../types";
import { Tasks } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";
import { addTaskWithTime, removeTask } from "../../../../util/tasks-utils";

export function getDayKey(day: Moment) {
  return day.format(DEFAULT_DAILY_NOTE_FORMAT);
}

export function moveTaskToDay(baseline: Tasks, task: Task, day: Moment) {
  const sourceKey = getDayKey(task.startTime);
  const destKey = getDayKey(day);
  const source = baseline[sourceKey];
  const dest = baseline[destKey];

  return {
    ...baseline,
    [sourceKey]: removeTask(task, source),
    [destKey]: addTaskWithTime(task, dest),
  };
}

export function dragAndShiftOthers(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);
  const preceding = baseline.slice(0, index);
  const following = baseline.slice(index + 1);

  const updated = {
    ...editTarget,
    startMinutes: cursorTime,
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

  return [...updatedPreceding, updated, ...updatedFollowing];
}
