import type { Readable } from "svelte/store";
import { derived, get, writable } from "svelte/store";

import type { settings } from "../../../global-store/settings";
import type { OnUpdateFn, TasksForDay } from "../../../types";

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
  pointerOffsetY,
  settings,
  fileSyncInProgress,
  onUpdate,
}: UseEditProps) {
  const baseline = writable(tasks);
  const editOperation = writable<EditOperation | undefined>();

  const displayedTasks = derived(
    [editOperation, pointerOffsetY, baseline, settings],
    ([$editOperation, $pointerOffsetY, baseline, $settings]) => {
      if (!$editOperation) {
        return baseline;
      }

      const cursorMinutes = offsetYToMinutes(
        $pointerOffsetY,
        $settings.zoomLevel,
        $settings.startHour,
      );

      return {
        ...baseline,
        withTime: transform(baseline.withTime, cursorMinutes, $editOperation),
      };
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

    baseline.set({
      ...currentTasks,
      withTime: currentTasks.withTime.map((t) => ({ ...t, isGhost: true })),
    });
    editOperation.set(undefined);

    await onUpdate(tasks.withTime, currentTasks.withTime);
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
