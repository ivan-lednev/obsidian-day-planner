import type { Readable, Writable } from "svelte/store";
import { derived, get, writable } from "svelte/store";

import { DayPlannerSettings } from "../../../settings";
import type { OnUpdateFn, TasksForDay } from "../../../types";
import { findUpdated, offsetYToMinutes } from "../../../util/task-utils";

import { transform } from "./transform/transform";
import type { EditOperation } from "./types";

interface UseEditProps {
  tasks: TasksForDay;
  pointerOffsetY: Readable<number>;
  settings: DayPlannerSettings;
  fileSyncInProgress: Readable<boolean>;
  onUpdate: OnUpdateFn;
  editOperation: Writable<EditOperation | undefined>;
}

export function useEdit({
  editOperation,
  tasks,
  pointerOffsetY,
  settings,
  // todo: move up
  fileSyncInProgress,
  onUpdate,
}: UseEditProps) {
  const baselineTasks = writable(tasks);

  const baseDisplayedTasks = derived(
    [editOperation, pointerOffsetY, baselineTasks],
    ([$editOperation, $pointerOffsetY, $baselineTasks]) => {
      if (!$editOperation) {
        return $baselineTasks;
      }

      const cursorMinutes = offsetYToMinutes(
        $pointerOffsetY,
        settings.zoomLevel,
        settings.startHour,
      );

      return transform($baselineTasks, cursorMinutes, $editOperation);
    },
  );

  const editStatus = derived(
    editOperation,
    ($editOperation) => $editOperation?.mode,
  );

  function startEdit(operation: EditOperation) {
    if (!get(fileSyncInProgress)) {
      editOperation.set(operation);
    }
  }

  async function confirmEdit() {
    if (get(editOperation) === undefined) {
      return;
    }

    const currentTasks = get(baseDisplayedTasks);

    // todo: order matters! Make it more explicit
    editOperation.set(undefined);

    const dirty = findUpdated(tasks.withTime, currentTasks.withTime);

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
    displayedTasks: baseDisplayedTasks,
    editStatus,
  };
}
