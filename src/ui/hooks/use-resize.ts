import { writable } from "svelte/store";

import { sizeToDuration } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

export function useResize() {
  const resizing = writable(false);

  function startResize() {
    resizing.set(true);
  }

  async function confirmResize(
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

  function cancelResize() {
    resizing.set(false);
  }

  return {
    resizing,
    startResize,
    confirmResize,
    cancelResize,
  };
}
