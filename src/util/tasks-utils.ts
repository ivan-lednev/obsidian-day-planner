import { difference, differenceBy } from "lodash/fp";
import { Moment } from "moment/moment";

import { Diff, PlacedTask, Task, Tasks, TasksForDay } from "../types";
import {
  getDayKey,
  moveTaskToDay,
} from "../ui/hooks/use-edit/transform/drag-and-shift-others";

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

function getCreatedTasks(flatBaseline: PlacedTask[], flatNext: PlacedTask[]) {
  return differenceBy((task) => task.id, flatNext, flatBaseline);
}

function getTasksWithUpdatedTime(
  flatBaseline: PlacedTask[],
  flatNext: PlacedTask[],
) {
  const pristine = getPristine(flatBaseline, flatNext);

  return difference(flatNext, pristine).filter((task) => !task.isGhost);
}

export function getDiff(baseline: Tasks, next: Tasks) {
  const flatBaseline = getTasksWithTime(baseline);
  const flatNext = getTasksWithTime(next);

  return {
    updatedTime: getTasksWithUpdatedTime(flatBaseline, flatNext),
    updatedDay: getTasksWithUpdatedDay(next),
    created: getCreatedTasks(flatBaseline, flatNext),
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
