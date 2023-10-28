import type { Readable } from "svelte/store";
import { derived, get, writable } from "svelte/store";

import type { settings } from "../../../global-store/settings";
import type { OnUpdateFn, TasksForDay } from "../../../types";
import { findUpdated } from "../../../util/task-utils";

import { transform } from "./transform/transform";
import type { EditOperation } from "./types";

interface UseEditProps {
  tasks: TasksForDay;
  pointerOffsetY: Readable<number>;
  settings: typeof settings;
  fileSyncInProgress: Readable<boolean>;
  onUpdate: OnUpdateFn;
}

// todo: move to utils
export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function useEdit({
  tasks,
  // todo: just pass time
  pointerOffsetY,
  settings,
  fileSyncInProgress,
  onUpdate,
}: UseEditProps) {
  const baselineTasks = writable(tasks);
  const editOperation = writable<EditOperation | undefined>();

  const displayedTasks = derived(
    [editOperation, pointerOffsetY, baselineTasks, settings],
    ([$editOperation, $pointerOffsetY, $baselineTasks, $settings]) => {
      if (!$editOperation) {
        return $baselineTasks;
      }

      const cursorMinutes = offsetYToMinutes(
        $pointerOffsetY,
        $settings.zoomLevel,
        $settings.startHour,
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

    const currentTasks = get(displayedTasks);

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
    displayedTasks,
    editStatus,
  };
}
