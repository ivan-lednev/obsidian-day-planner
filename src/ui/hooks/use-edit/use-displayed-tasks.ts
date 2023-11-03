import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import { Task, TasksForDay } from "../../../types";

import { transform } from "./transform/transform";
import { EditOperation } from "./types";

export function removeTask(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

export function addTask(task: Task, tasks: TasksForDay) {
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
        const tasks = addTask($editOperation.task, $baselineTasks);

        return transform(tasks, $cursorMinutes, $editOperation);
      }

      if (!thisDayIsUnderCursor && taskComesFromThisDay) {
        const tasks = removeTask($editOperation.task, $baselineTasks);

        return transform(tasks, $cursorMinutes, $editOperation);
      }

      return $baselineTasks;
    },
  );
}
