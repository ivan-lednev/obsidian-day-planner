import { get, type Readable, type Writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type { LocalTask } from "../../../task-types";
import type { OnUpdateFn } from "../../../types";

import type { EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTasks: Writable<LocalTask[]>;
  editOperation: Writable<EditOperation | undefined>;
  tasksWithPendingUpdate: Readable<LocalTask[]>;
  onUpdate: OnUpdateFn;
}

export function useEditActions({
  editOperation,
  baselineTasks,
  tasksWithPendingUpdate,
  onUpdate,
}: UseEditActionsProps) {
  function startEdit(operation: EditOperation) {
    navigator.vibrate?.(vibrationDurationMillis);
    editOperation.set(operation);
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  async function confirmEdit() {
    const currentOperation = get(editOperation);

    if (currentOperation === undefined) {
      return;
    }

    const oldBase = get(baselineTasks);
    const currentTasks = get(tasksWithPendingUpdate);

    baselineTasks.set(currentTasks);
    editOperation.set(undefined);

    await onUpdate(oldBase, currentTasks, currentOperation.mode);
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
