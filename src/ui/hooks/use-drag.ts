import { writable } from "svelte/store";

import { getTimeFromYOffset } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

import { useEdit } from "./use-edit";

export function useDrag() {
  const dragging = writable(false);
  const pointerYOffsetToTaskStart = writable<number>();

  const { startEdit, stopEdit, editConfirmed } = useEdit(dragging);

  function handleMoveStart(event: MouseEvent) {
    startEdit();

    pointerYOffsetToTaskStart.set(event.offsetY);
  }

  async function handleMoveConfirm(
    offset: number,
    id: string,
    // todo: we don't need duration here
    durationMinutes: number,
  ) {
    stopEdit();

    const newStartMinutes = getTimeFromYOffset(offset);

    await updateTimestamps(id, {
      startMinutes: newStartMinutes,
      durationMinutes,
    });
  }

  return {
    pointerYOffsetToTaskStart,
    dragging,
    moveConfirmed: editConfirmed,
    handleMoveStart,
    handleMoveConfirm,
  };
}
