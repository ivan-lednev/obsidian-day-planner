import { derived, get, writable } from "svelte/store";

import { getTimeFromYOffset } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

export function useDrag() {
  const dragging = writable(false);
  const pointerYOffsetToTaskStart = writable<number>();
  const cursor = derived(dragging, ($dragging) =>
    $dragging ? "grabbing" : "grab",
  );

  function startMove(event: MouseEvent) {
    dragging.set(true);

    pointerYOffsetToTaskStart.set(event.offsetY);
  }

  async function confirmMove(
    offset: number,
    id: string,
    // todo: we don't need duration here
    durationMinutes: number,
  ) {
    if (!get(dragging)) {
      return;
    }

    dragging.set(false);

    const newStartMinutes = getTimeFromYOffset(Math.floor(offset));

    await updateTimestamps(id, {
      startMinutes: newStartMinutes,
      durationMinutes,
    });
  }

  function cancelMove() {
    dragging.set(false);
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
