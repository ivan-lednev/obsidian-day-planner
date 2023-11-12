import { Moment } from "moment/moment";

import { Task, Tasks, TasksForDay } from "../types";
import {
  getDayKey,
  moveTaskToDay,
} from "../ui/hooks/use-edit/transform/drag-and-shift-others";

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
