import { getTimeFromYOffset } from "src/store/timeline-store";
import { updateTimestamps } from "src/store/update-timestamp";
import { Readable, get, writable } from "svelte/store";

export function useDrag(
  { text, durationMinutes }: { text: string; durationMinutes: number },
  pointerYOffset: Readable<number>,
) {
  const dragging = writable(false);
  const pointerYOffsetToTaskStart = writable<number>();

  function handleMoveStart(event: MouseEvent) {
    dragging.set(true);
    pointerYOffsetToTaskStart.set(event.offsetY);
  }

  function handleMoveCancel() {
    dragging.set(false);
  }

  async function handleMoveConfirm(event: MouseEvent) {
    dragging.set(false);

    const newStartMinutes = getTimeFromYOffset(
      get(pointerYOffset) - event.offsetY,
    );

    await updateTimestamps(text, {
      startMinutes: newStartMinutes,
      durationMinutes,
    });
  }

  return {
    pointerYOffsetToTaskStart,
    dragging,
    handleMoveStart,
    handleMoveCancel,
    handleMoveConfirm,
  };
}
