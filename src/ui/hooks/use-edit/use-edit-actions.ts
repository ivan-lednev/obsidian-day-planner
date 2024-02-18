import { get, Readable, Writable } from "svelte/store";

import { OnUpdateFn, Tasks } from "../../../types";
import { areValuesEmpty } from "../../../util/task-utils";
import { getDiff, updateText } from "../../../util/tasks-utils";

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

    editOperation.set(undefined);

    // todo: diffing can be moved outside to separate concerns
    //  but we need to know if something changed to not cause extra rewrites?
    const diff = getDiff(get(baselineTasks), currentTasks);

    if (areValuesEmpty(diff)) {
      return;
    }

    baselineTasks.set(currentTasks);
    console.log(diff);

    await onUpdate({ ...updateText(diff), moved: diff.moved });
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
