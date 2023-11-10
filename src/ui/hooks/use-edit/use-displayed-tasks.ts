import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import {
  CursorPos,
  Task,
  TasksForDay,
  Tasks,
} from "../../../types";

import { transform, transform_MULTIDAY } from "./transform/transform";
import { EditOperation } from "./types";

export function removeTaskWithTime(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

export function addTaskWithTime(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: [...tasks.withTime, task],
  };
}

interface UseDisplayedTasksProps {
  day: Moment;
  editOperation: Readable<EditOperation>;
  cursorMinutes: Readable<number>;
  baselineTasks: Readable<TasksForDay>;
}

export function useDisplayedTasks({
  day,
  editOperation,
  cursorMinutes,
  baselineTasks,
}: UseDisplayedTasksProps) {
  return derived(
    [editOperation, cursorMinutes, baselineTasks],
    ([$editOperation, $cursorMinutes, $baselineTasks]) => {
      if (!$editOperation) {
        return $baselineTasks;
      }

      const thisDayIsUnderCursor = $editOperation.day.isSame(day, "day");
      const taskComesFromThisDay = $editOperation.task.startTime.isSame(
        day,
        "day",
      );

      if (thisDayIsUnderCursor && taskComesFromThisDay) {
        return transform($baselineTasks, $cursorMinutes, $editOperation);
      }

      if (thisDayIsUnderCursor && !taskComesFromThisDay) {
        const tasks = addTaskWithTime($editOperation.task, $baselineTasks);

        return transform(tasks, $cursorMinutes, $editOperation);
      }

      if (!thisDayIsUnderCursor && taskComesFromThisDay) {
        const tasks = removeTaskWithTime($editOperation.task, $baselineTasks);

        return transform(tasks, $cursorMinutes, $editOperation);
      }

      return $baselineTasks;
    },
  );
}

export interface UseDisplayedTasksProps_MULTIDAY {
  editOperation: Readable<EditOperation>;
  cursorPos: Readable<CursorPos>;
  baselineTasks: Readable<Tasks>;
}

export function useDisplayedTasks_MULTIDAY({
  editOperation,
  baselineTasks,
  cursorPos,
}: UseDisplayedTasksProps_MULTIDAY) {
  return derived(
    [editOperation, cursorPos, baselineTasks],
    ([$editOperation, $cursorPos, $baselineTasks]) => {
      if (!$editOperation) {
        return $baselineTasks;
      }

      return transform_MULTIDAY($baselineTasks, $cursorPos, $editOperation);
    },
  );
}
