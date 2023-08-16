import { sizeToDuration } from "src/store/timeline-store";
import { updateTimestamps } from "src/store/update-timestamp";
import { writable } from "svelte/store";

export function useResize() {
  const resizing = writable(false);

  function handleResizeStart() {
    resizing.set(true);
  }

  function handleResizeCancel() {
    resizing.set(false);
  }

  async function handleResizeConfirm(
    text: string,
    taskHeight: number,
    // todo: don't need start minutes here
    startMinutes: number,
  ) {
    resizing.set(false);

    const newDurationMinutes = sizeToDuration(taskHeight);

    await updateTimestamps(text, {
      startMinutes,
      durationMinutes: newDurationMinutes,
    });
  }

  return {
    resizing,
    handleResizeStart,
    handleResizeConfirm,
    handleResizeCancel,
  };
}
