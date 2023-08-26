import { getContext } from "svelte";
import { get, writable } from "svelte/store";

import { TASKS } from "../../constants";
import { sizeToDuration } from "../../store/timeline-store";
import { updateTimestamps } from "../../store/update-timestamp";
import type { TasksContext } from "../../types";

export function useResize() {
  const resizing = writable(false);

  const { getTasks } = getContext<TasksContext>(TASKS);

  function startResize() {
    resizing.set(true);
  }

  async function confirmResize(
    id: string,
    taskHeight: number,
    // todo: don't need start minutes here
    startMinutes: number,
  ) {
    if (!get(resizing)) {
      return;
    }

    resizing.set(false);

    const newDurationMinutes = sizeToDuration(taskHeight);

    await updateTimestamps(getTasks(), id, {
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
