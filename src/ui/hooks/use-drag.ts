import { writable } from "svelte/store";

import { getTimeFromYOffset } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

export function useDrag() {
  const dragging = writable(false);
  const pointerYOffsetToTaskStart = writable<number>();

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
    dragging.set(false);

    const newStartMinutes = getTimeFromYOffset(offset);

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
    dragging,
    startMove,
    confirmMove,
    cancelMove,
  };
}
