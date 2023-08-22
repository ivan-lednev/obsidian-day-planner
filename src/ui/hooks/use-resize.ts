import { writable } from "svelte/store";

import { sizeToDuration } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

export function useResize() {
  const resizing = writable(false);

  function handleResizeStart() {
    resizing.set(true);
  }

  async function handleResizeConfirm(
    id: string,
    taskHeight: number,
    // todo: don't need start minutes here
    startMinutes: number,
  ) {
    resizing.set(false);

    const newDurationMinutes = sizeToDuration(taskHeight);

    await updateTimestamps(id, {
      startMinutes,
      durationMinutes: newDurationMinutes,
    });
  }

  function handleResizeCancel() {
    resizing.set(false);
  }

  return {
    resizing,
    handleResizeStart,
    handleResizeConfirm,
    handleResizeCancel,
  };
}
