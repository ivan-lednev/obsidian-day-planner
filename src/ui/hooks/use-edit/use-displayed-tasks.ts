import { derived, Readable } from "svelte/store";

import { CursorPos, Task, TasksForDay, Tasks } from "../../../types";

import { transform_MULTIDAY } from "./transform/transform";
import { EditOperation } from "./types";

export function removeTask(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    noTime: tasks.noTime.filter((t) => t.id !== task.id),
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

export function moveToTimed(task: Task, tasks: TasksForDay) {
  const withRemoved = removeTask(task, tasks);
  return { ...withRemoved, withTime: [...withRemoved.withTime, task] };
}

export function addTaskWithTime(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: [...tasks.withTime, task],
  };
}

export interface UseDisplayedTasksProps {
  editOperation: Readable<EditOperation>;
  cursorPos: Readable<CursorPos>;
  baselineTasks: Readable<Tasks>;
}

export function useDisplayedTasks({
  editOperation,
  baselineTasks,
  cursorPos,
}: UseDisplayedTasksProps) {
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
