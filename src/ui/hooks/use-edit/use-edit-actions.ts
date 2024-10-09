import { get, type Readable, type Writable } from "svelte/store";

import type { DayToTasks } from "../../../task-types";
import type { OnUpdateFn } from "../../../types";

import type { EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTasks: Writable<DayToTasks>;
  editOperation: Writable<EditOperation | undefined>;
  displayedTasks: Readable<DayToTasks>;
  onUpdate: OnUpdateFn;
}

export function useEditActions({
  editOperation,
  baselineTasks,
  displayedTasks,
  onUpdate,
}: UseEditActionsProps) {
  function startEdit(operation: EditOperation) {
    editOperation.set(operation);
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  async function confirmEdit() {
    if (get(editOperation) === undefined) {
      return;
    }

    const oldBase = get(baselineTasks);
    const currentTasks = get(displayedTasks);

    baselineTasks.set(currentTasks);
    editOperation.set(undefined);

    await onUpdate(oldBase, currentTasks);
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
