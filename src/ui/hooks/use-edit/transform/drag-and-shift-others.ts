import { last } from "lodash";

import type { PlacedTask, Task } from "../../../../types";
import { getEndMinutes } from "../../../../util/task-utils";
import { CursorPos, Tasks } from "../../../../types";
import { EditOperation } from "../types";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";
import { addTaskWithTime, removeTaskWithTime } from "../use-displayed-tasks";
import { Moment } from "moment";

export function getDayKey(day: Moment) {
  return day.format(DEFAULT_DAILY_NOTE_FORMAT);
}

export function moveTaskToDay(baseline: Tasks, task: Task, day: Moment) {
  if (day.isSame(task.startTime, "day")) {
    return baseline;
  }

  const sourceKey = getDayKey(task.startTime);
  const destKey = getDayKey(day);
  const source = baseline[sourceKey];
  const dest = baseline[destKey];

  return {
    ...baseline,
    [sourceKey]: removeTaskWithTime(task, source),
    [destKey]: addTaskWithTime(task, dest),
  };
}

export function dragAndShiftOthers_MULTIDAY(
  baseline: Tasks,
  cursorPos: CursorPos,
  operation: EditOperation,
) {
  // todo: move this above
  const moved = moveTaskToDay(baseline, operation.task, cursorPos.day);

  const destKey = getDayKey(cursorPos.day);
  const destTasks = moved[destKey];

  const transformedDest = {
    ...destTasks,
    withTime: dragAndShiftOthers(
      destTasks.withTime.sort((a, b) => a.startMinutes - b.startMinutes),
      operation.task,
      cursorPos.minutes,
    ),
  };

  return {
    ...moved,
    [destKey]: transformedDest,
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
