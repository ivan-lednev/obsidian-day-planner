import { get, Readable, Writable } from "svelte/store";

import { OnUpdateFn, Tasks } from "../../../types";
import { findUpdated } from "../../../util/task-utils";
import { getTasksWithTime } from "../../../util/tasks-utils";

import { EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTasks: Writable<Tasks>;
  editOperation: Writable<EditOperation>;
  displayedTasks: Readable<Tasks>;
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

    const currentTasks = get(displayedTasks);

    // todo: order matters! Make it more explicit
    editOperation.set(undefined);

    const dirty = findUpdated(
      getTasksWithTime(get(baselineTasks)),
      getTasksWithTime(currentTasks),
    );

    if (dirty.length === 0) {
      return;
    }

    baselineTasks.set(currentTasks);
    await onUpdate(dirty);
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
