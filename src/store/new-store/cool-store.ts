import { getContext } from "svelte";
import { derived, writable } from "svelte/store";

import { TASKS_FOR_DAY } from "../../constants";
import type { PlacedPlanItem } from "../../types";
import type { TasksContext } from "../../types";
import { getTimeFromYOffset } from "../timeline-store";
import { updateTimestamps } from "../update-timestamp";

import type { createSettings } from "./create-settings";

export const tasks = writable<PlacedPlanItem[]>([]);

export type ReactiveSettingsWithUtils = ReturnType<typeof createSettings>;

export function useDrag() {
  const dragging = writable(false);

  let currentlyDragging = false;

  dragging.subscribe((value) => {
    currentlyDragging = value;
  });

  const pointerYOffsetToTaskStart = writable<number>();

  const cursor = derived(dragging, ($dragging) =>
    $dragging ? "grabbing" : "grab",
  );

  const { getTasks } = getContext<TasksContext>(TASKS_FOR_DAY);

  function startMove(cursorOffset: number) {
    dragging.set(true);

    pointerYOffsetToTaskStart.set(cursorOffset);
  }

  async function confirmMove(
    offset: number,
    id: string,
    durationMinutes: number,
  ) {
    if (!currentlyDragging) {
      return;
    }

    dragging.set(false);

    const newStartMinutes = getTimeFromYOffset(Math.floor(offset));

    // we need all of them at once to calculate overlap
    await updateTimestamps(getTasks(), id, {
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
