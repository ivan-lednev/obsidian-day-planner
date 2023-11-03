import { get, Readable, Writable } from "svelte/store";

import { OnUpdateFn, TasksForDay } from "../../../types";
import { findUpdated } from "../../../util/task-utils";

import { EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTasks: Writable<TasksForDay>;
  editOperation: Writable<EditOperation>;
  displayedTasks: Readable<TasksForDay>;
  fileSyncInProgress: Readable<boolean>;
  onUpdate: OnUpdateFn;
}

export function useEditActions({
  editOperation,
  baselineTasks,
  displayedTasks,
  fileSyncInProgress,
  onUpdate,
}: UseEditActionsProps) {
  function startEdit(operation: EditOperation) {
    if (!get(fileSyncInProgress)) {
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
