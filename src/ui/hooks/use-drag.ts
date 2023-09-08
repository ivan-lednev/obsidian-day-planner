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
  const pointerYOffsetToTaskStart = writable<number>();

  const cursor = derived(dragging, ($dragging) =>
    $dragging ? "grabbing" : "grab",
  );

  function startMove() {
    dragging.set(true);
    // todo: this should be more precise: cursoroffset + a bit of task above it
    pointerYOffsetToTaskStart.set(get(cursorOffsetY));
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
    pointerYOffsetToTaskStart,
    cursor,
    dragging,
    startMove,
    confirmMove,
    cancelMove,
  };
}
