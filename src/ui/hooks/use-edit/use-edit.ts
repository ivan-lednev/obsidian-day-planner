import type { Readable } from "svelte/store";
import { derived, get, writable } from "svelte/store";

import type { settings } from "../../../global-stores/settings";
import type { OnUpdateFn, PlacedPlanItem } from "../../../types";

import { transform } from "./transform/transform";
import type { EditOperation } from "./types";

interface UseEditProps {
  parsedTasks: PlacedPlanItem[];
  pointerOffsetY: Readable<number>;
  settings: typeof settings;
  onUpdate: OnUpdateFn;
}

// todo: this is duplicated, but this version is more efficient
export function offsetYToMinutes_NEW(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function useEdit({
  parsedTasks,
  pointerOffsetY,
  settings,
  onUpdate,
}: UseEditProps) {
  const baselineTasks = writable(parsedTasks);
  const editOperation = writable<EditOperation | "idle">("idle");

  const displayedTasks = derived(
    [editOperation, pointerOffsetY, baselineTasks, settings],
    ([$editOperation, $pointerOffsetY, $baselineTasks, $settings]) => {
      if ($editOperation === "idle") {
        return $baselineTasks;
      }

      const cursorMinutes = offsetYToMinutes_NEW(
        $pointerOffsetY,
        $settings.zoomLevel,
        $settings.startHour,
      );

      return transform($baselineTasks, cursorMinutes, $editOperation);
    },
  );

  const isEditInProgress = derived(
    editOperation,
    ($editOperation) => $editOperation !== "idle",
  );

  // todo: pass an object, no need to translate args to objects
  function startEdit(operation: EditOperation) {
    editOperation.set(operation);
  }

  async function confirmEdit() {
    const currentTasks = get(displayedTasks);

    // todo: this should be hidden inside creation logic?
    baselineTasks.set(currentTasks.map((t) => ({ ...t, isGhost: false })));
    editOperation.set("idle");

    await onUpdate(parsedTasks, currentTasks);
  }

  function cancelEdit() {
    editOperation.set("idle");
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
    displayedTasks,
    isEditInProgress,
  };
}
