import { Moment } from "moment";
import { derived, get, Readable, Writable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { ObsidianFacade } from "../../service/obsidian-facade";
import { DayPlannerSettings } from "../../settings";
import { GetTasksForDay, OnUpdateFn, Task, TasksForDay } from "../../types";
import { findUpdated, offsetYToMinutes } from "../../util/task-utils";

import { transform } from "./use-edit/transform/transform";
import { EditOperation } from "./use-edit/types";
import { useEditHandlers } from "./use-edit-handlers";

export interface CreateEditContextProps {
  getTasksForDay: GetTasksForDay;
  fileSyncInProgress: Readable<boolean>;
  obsidianFacade: ObsidianFacade;
  onUpdate: OnUpdateFn;
  pointerOffsetY: Readable<number>;
  settings: DayPlannerSettings;
}

function removeTask(task: Task, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

function addTask(task: Task, tasks: TasksForDay) {
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
  dayUnderEdit: Readable<Moment>;
}

function useDisplayedTasks({
  day,
  editOperation,
  cursorMinutes,
  baselineTasks,
  dayUnderEdit,
}: UseDisplayedTasksProps) {
  return derived(
    [editOperation, cursorMinutes, baselineTasks, dayUnderEdit],
    ([$editOperation, $cursorMinutes, $baselineTasks, $dayUnderEdit]) => {
      if (!$editOperation) {
        return $baselineTasks;
      }

      const thisDayIsUnderCursor = $dayUnderEdit.isSame(day, "day");
      const taskComesFromThisDay = $editOperation.task.startTime.isSame(
        day,
        "day",
      );

      let tasksToTransform = $baselineTasks;

      if (thisDayIsUnderCursor && !taskComesFromThisDay) {
        tasksToTransform = addTask($editOperation.task, $baselineTasks);
      } else if (!thisDayIsUnderCursor && taskComesFromThisDay) {
        tasksToTransform = removeTask($editOperation.task, $baselineTasks);
      }

      return transform(tasksToTransform, $cursorMinutes, $editOperation);
    },
  );
}

interface UseEditProps {
  day: Moment;
  baselineTasks: Writable<TasksForDay>;
  dayUnderEdit: Writable<Moment>;
  editOperation: Writable<EditOperation>;
  displayedTasks: Readable<TasksForDay>;
  fileSyncInProgress: Readable<boolean>;
  onUpdate: OnUpdateFn;
}

function useEdit({
  day,
  editOperation,
  baselineTasks,
  displayedTasks,
  dayUnderEdit,
  fileSyncInProgress,
  onUpdate,
}: UseEditProps) {
  function startEdit(operation: EditOperation) {
    if (!get(fileSyncInProgress)) {
      dayUnderEdit.set(day);
      editOperation.set(operation);
    }
  }

  async function confirmEdit() {
    if (get(editOperation) === undefined) {
      return;
    }

    const currentTasks = get(displayedTasks);

    // todo: order matters! Make it more explicit
    editOperation.set(undefined);

    const dirty = findUpdated(
      get(baselineTasks).withTime,
      currentTasks.withTime,
    );

    if (dirty.length === 0) {
      return;
    }

    baselineTasks.set(currentTasks);
    await onUpdate(dirty);
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}

function useCursorMinutes(
  pointerOffsetY: Readable<number>,
  settings: DayPlannerSettings,
) {
  return derived(pointerOffsetY, ($pointerOffsetY) =>
    offsetYToMinutes($pointerOffsetY, settings.zoomLevel, settings.startHour),
  );
}

export function useEditContext({
  // todo: just derive a lookup from dataview results
  getTasksForDay,
  fileSyncInProgress,
  obsidianFacade,
  onUpdate,
  pointerOffsetY,
  settings,
}: CreateEditContextProps) {
  const dayUnderEdit = writable<Moment | undefined>();
  // todo: add dayUnderEdit to editOperation
  const editOperation = writable<EditOperation | undefined>();
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  function getEditHandlers(day: Moment) {
    const { withTime, noTime } = getTasksForDay(day);
    const tasks = { withTime: addHorizontalPlacing(withTime), noTime };
    const baselineTasks = writable(tasks);

    const displayedTasks = useDisplayedTasks({
      day,
      editOperation,
      cursorMinutes,
      baselineTasks,
      dayUnderEdit,
    });

    const { startEdit, confirmEdit, cancelEdit } = useEdit({
      day,
      editOperation,
      baselineTasks,
      displayedTasks,
      dayUnderEdit,
      fileSyncInProgress,
      onUpdate,
    });

    const handlers = useEditHandlers({
      day,
      dayUnderEdit,
      obsidianFacade,
      startEdit,
      cursorMinutes,
    });

    return {
      ...handlers,
      displayedTasks,
      cancelEdit,
      confirmEdit,
    };
  }

  return {
    getEditHandlers,
  };
}
