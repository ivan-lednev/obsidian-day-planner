import { difference, differenceBy } from "lodash/fp";
import { Moment } from "moment/moment";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";

import {
  Diff,
  PlacedTask,
  Task,
  Tasks,
  TasksForDay,
  UnscheduledTask,
} from "../types";

import {
  isEqualTask,
  updateTaskScheduledDay,
  updateTaskText,
} from "./task-utils";

export function getEmptyTasksForDay(): TasksForDay {
  return { withTime: [], noTime: [] };
}

export function getTasksWithTime(tasks: Tasks) {
  return Object.values(tasks).flatMap(({ withTime }) => withTime);
}

export function getFlatTasks(tasks: Tasks) {
  return Object.values(tasks).flatMap(({ withTime, noTime }) => [
    ...withTime,
    ...noTime,
  ]);
}

export function removeTask(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    noTime: tasks.noTime.filter((t) => t.id !== task.id),
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

export function addTaskWithTime(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: [...tasks.withTime, task],
  };
}

export function moveToTimed(task: Task, tasks: TasksForDay) {
  const withRemoved = removeTask(task, tasks);
  return { ...withRemoved, withTime: [...withRemoved.withTime, task] };
}

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

export function moveTaskToColumn(day: Moment, task: Task, baseline: Tasks) {
  if (day.isSame(task.startTime, "day")) {
    const key = getDayKey(task.startTime);

    return {
      ...baseline,
      [key]: moveToTimed(task, baseline[key]),
    };
  }

  return moveTaskToDay(baseline, task, day);
}

export function getTasksWithUpdatedDay(tasks: Tasks) {
  return Object.entries(tasks)
    .flatMap(([dayKey, tasks]) =>
      tasks.withTime.map((task) => ({ dayKey, task })),
    )
    .filter(
      ({ dayKey, task }) =>
        !task.isGhost && dayKey !== getDayKey(task.startTime),
    );
}

function getPristine(flatBaseline: PlacedTask[], flatNext: PlacedTask[]) {
  return flatNext.filter((task) =>
    flatBaseline.find((baselineTask) => isEqualTask(task, baselineTask)),
  );
}

function getCreatedTasks(base: UnscheduledTask[], next: UnscheduledTask[]) {
  return differenceBy((task) => task.id, next, base);
}

function getTasksWithUpdatedTime(base: PlacedTask[], next: PlacedTask[]) {
  const pristine = getPristine(base, next);

  return difference(next, pristine).filter((task) => !task.isGhost);
}

export function getDiff(base: Tasks, next: Tasks) {
  return {
    updatedTime: getTasksWithUpdatedTime(
      getTasksWithTime(base),
      getTasksWithTime(next),
    ),
    updatedDay: getTasksWithUpdatedDay(next),
    created: getCreatedTasks(getFlatTasks(base), getFlatTasks(next)),
  };
}

export function updateText(diff: Diff) {
  return {
    created: diff.created.map(updateTaskText),
    updated: [
      ...diff.updatedTime.map(updateTaskText),
      ...diff.updatedDay.map(({ dayKey, task }) =>
        updateTaskText(updateTaskScheduledDay(task, dayKey)),
      ),
    ],
  };
}
