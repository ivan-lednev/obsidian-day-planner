import { derived, get, Readable, Writable, writable } from "svelte/store";

import type { PlanItem } from "../../types";

import type { createSettings } from "./create-settings";

export type ReactiveSettingsWithUtils = ReturnType<typeof createSettings>;

interface UseDragProps {
  settings: ReactiveSettingsWithUtils;
  cursorOffsetY: Readable<number>;
  task: Writable<PlanItem>;
}

export function useDrag({ settings, cursorOffsetY, task }: UseDragProps) {
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
      Math.floor(get(cursorOffsetY)),
    );

    // todo: all tasks should update here and get new overlap
    task.update((previous) => ({ ...previous, startMinutes: newStartMinutes }));

    // tasks.update((previous) => addPlacing([...previous, newPlanItem]));
    // await updateStartMinutes([], id, newStartMinutes);
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
