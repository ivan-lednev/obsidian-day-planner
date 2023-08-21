import { writable } from "svelte/store";

import { sizeToDuration } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";

import { useEdit } from "./use-edit";

export function useResize() {
  const resizing = writable(false);
  const { startEdit, stopEdit, editConfirmed } = useEdit(resizing);

  function handleResizeStart() {
    startEdit();
  }

  async function handleResizeConfirm(
    id: string,
    taskHeight: number,
    // todo: don't need start minutes here
    startMinutes: number,
  ) {
    stopEdit();

    const newDurationMinutes = sizeToDuration(taskHeight);

    await updateTimestamps(id, {
      startMinutes,
      durationMinutes: newDurationMinutes,
    });
  }

  return {
    resizing,
    resizeConfirmed: editConfirmed,
    handleResizeStart,
    handleResizeConfirm,
  };
}
