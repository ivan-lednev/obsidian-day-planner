import { derived, get, Readable, writable } from "svelte/store";

import { snap } from "../../global-stores/settings-utils";
import type { settingsWithUtils } from "../../global-stores/settings-with-utils";
import type { PlanItem } from "../../types";

export type ReactiveSettingsWithUtils = typeof settingsWithUtils;

interface UseDragProps {
  settings: ReactiveSettingsWithUtils;
  cursorOffsetY: Readable<number>;
  task: PlanItem;
  onUpdate: (updated: PlanItem) => Promise<void>;
}

export function useDrag({
  settings,
  cursorOffsetY,
  task,
  onUpdate,
}: UseDragProps) {
  const dragging = writable(false);

  const cursor = derived(dragging, ($dragging) =>
    $dragging ? "grabbing" : "grab",
  );

  function startMove() {
    dragging.set(true);
  }

  function cancelMove() {
    dragging.set(false);
  }

  async function confirmMove() {
    // todo: shouldn't this one be handled in the component?
    if (!get(dragging)) {
      return;
    }

    dragging.set(false);

    const newStartMinutes = settings.getTimeFromYOffset(
      // todo: duplication
      snap(Math.floor(get(cursorOffsetY)), get(settings.settings).zoomLevel),
    );
    const newEndMinutes = newStartMinutes + task.durationMinutes;

    await onUpdate({
      ...task,
      startMinutes: newStartMinutes,
      endMinutes: newEndMinutes,
    });
  }

  return {
    cursor,
    dragging,
    startMove,
    confirmMove,
    cancelMove,
  };
}
