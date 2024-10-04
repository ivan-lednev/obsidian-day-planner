import { mergeWith } from "lodash/fp";
import type { Moment } from "moment/moment";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";

import { scheduledPropRegExps } from "../regexp";
import {
  type DayToTasks,
  type LocalTask,
  type Task,
  type TasksForDay,
  type WithTime,
  isRemote,
} from "../task-types";

import { getMinutesSinceMidnight, minutesToMomentOfDay } from "./moment";
import { updateTaskText } from "./task-utils";

export function getEmptyRecordsForDay(): TasksForDay {
  return { withTime: [], noTime: [] };
}

export function removeTask(task: WithTime<LocalTask>, tasks: TasksForDay) {
  return {
    ...tasks,
    noTime: tasks.noTime.filter((t) => t.id !== task.id),
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

export function addTaskWithTime(task: WithTime<LocalTask>, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: [...tasks.withTime, task],
  };
}

export function moveToTimed(task: WithTime<LocalTask>, tasks: TasksForDay) {
  const withRemoved = removeTask(task, tasks);
  return { ...withRemoved, withTime: [...withRemoved.withTime, task] };
}

export function getDayKey(day: Moment) {
  return day.format(DEFAULT_DAILY_NOTE_FORMAT);
}

export function moveTaskToDay(
  baseline: DayToTasks,
  task: WithTime<LocalTask>,
  day: Moment,
) {
  const sourceKey = getDayKey(task.startTime);
  const destKey = getDayKey(day);
  const source = baseline[sourceKey];
  const dest = baseline[destKey];

  const withUpdatedStartTime = {
    ...task,
    startTime: minutesToMomentOfDay(
      getMinutesSinceMidnight(task.startTime),
      day,
    ),
  };

  return {
    ...baseline,
    [sourceKey]: removeTask(withUpdatedStartTime, source),
    [destKey]: addTaskWithTime(withUpdatedStartTime, dest),
  };
}

export function moveTaskToColumn(
  day: Moment,
  task: WithTime<LocalTask>,
  baseline: DayToTasks,
) {
  if (day.isSame(task.startTime, "day")) {
    const key = getDayKey(task.startTime);

    return {
      ...baseline,
      [key]: moveToTimed(task, baseline[key]),
    };
  }

  return moveTaskToDay(baseline, task, day);
}

// todo: remove, replace with simple filter
function getEditableTasks(dayToTasks: DayToTasks) {
  const filteredEntries = Object.entries(dayToTasks).map(
    ([dayKey, tasks]) =>
      [
        dayKey,
        {
          noTime: tasks.noTime.filter(
            (task): task is LocalTask => !isRemote(task),
          ),
          withTime: tasks.withTime.filter(
            (task): task is WithTime<LocalTask> => !isRemote(task),
          ),
        },
      ] as const,
  );

  return Object.fromEntries<{
    withTime: WithTime<LocalTask>[];
    noTime: LocalTask[];
  }>(filteredEntries);
}

function getFlatTimeBlocks(dayToTasks: DayToTasks) {
  return Object.values(dayToTasks).flatMap(({ withTime, noTime }) => [
    ...withTime,
    ...noTime,
  ]);
}

// todo:
//  cover all kinds of props on all lines in parent block
function hasDateFromProp(task: LocalTask) {
  return scheduledPropRegExps.some((regexp) => regexp.test(task.text));
}

function isOnSameDay(a: WithTime<Task>, b: WithTime<Task>) {
  return a.startTime.isSame(b.startTime, "day");
}

function isOnSameTime(a: WithTime<Task>, b: WithTime<Task>) {
  return a.startTime.isSame(b.startTime);
}

export type Diff = {
  deleted: Array<LocalTask>;
  updated: Array<LocalTask>;
  created: Array<LocalTask>;
};

export function getDiff(base: DayToTasks, next: DayToTasks) {
  const editableBase = getEditableTasks(base);
  const editableNext = getEditableTasks(next);

  // todo: remove assertion
  const flatBase = getFlatTimeBlocks(editableBase) as Array<LocalTask>;
  const flatNext = (getFlatTimeBlocks(editableNext) as Array<LocalTask>).map(
    updateTaskText,
  );

  return flatNext.reduce<Diff>(
    (result, task) => {
      const thisTaskInBase = flatBase.find(
        (baseTask) => baseTask.id === task.id,
      );

      if (thisTaskInBase) {
        const needToMoveBetweenDailyNotes =
          !hasDateFromProp(task) && !isOnSameDay(thisTaskInBase, task);

        if (needToMoveBetweenDailyNotes) {
          result.deleted.push(task);
          result.created.push(task);
        } else if (!isOnSameTime(thisTaskInBase, task)) {
          result.updated.push(task);
        }
      } else {
        result.created.push(task);
      }

      return result;
    },
    {
      deleted: [],
      updated: [],
      created: [],
    },
  );
}

export const mergeTasks = mergeWith((value, sourceValue) => {
  return Array.isArray(value) ? value.concat(sourceValue) : undefined;
});
