import { writable } from "svelte/store";

import { getTimeFromYOffset } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

export function useDrag() {
  const dragging = writable(false);
  const pointerYOffsetToTaskStart = writable<number>();

  function handleMoveStart(event: MouseEvent) {
    dragging.set(true);

    pointerYOffsetToTaskStart.set(event.offsetY);
  }

  async function handleMoveConfirm(
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

  function handleMoveCancel() {
    dragging.set(false);
  }

  return {
    pointerYOffsetToTaskStart,
    dragging,
    handleMoveStart,
    handleMoveConfirm,
    handleMoveCancel,
  };
}
