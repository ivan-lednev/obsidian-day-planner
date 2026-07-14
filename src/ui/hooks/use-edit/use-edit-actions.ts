import { get, type Readable, type Writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type { EditableTimeBlock } from "../../../time-block-types";
import type { OnUpdateFn } from "../../../types";

import type { EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTasks: Writable<EditableTimeBlock[]>;
  editOperation: Writable<EditOperation | undefined>;
  tasksWithPendingUpdate: Readable<EditableTimeBlock[]>;
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

    const succeeded = await onUpdate(
      oldBase,
      currentTasks,
      currentOperation.mode,
    );

    if (!succeeded) {
      baselineTasks.set(oldBase);
    }
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
