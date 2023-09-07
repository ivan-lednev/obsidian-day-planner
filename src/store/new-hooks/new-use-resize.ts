import { get, Readable, writable } from "svelte/store";

import type { PlanItem } from "../../types";

import type { ReactiveSettingsWithUtils } from "./new-use-drag";

interface UseResizeProps {
  settings: ReactiveSettingsWithUtils;
  cursorOffsetY: Readable<number>;
  task: PlanItem;
  onUpdate: (updated: PlanItem) => Promise<void>;
}

export function useResize({
  settings,
  cursorOffsetY,
  onUpdate,
  task,
}: UseResizeProps) {
  const resizing = writable(false);

  function startResize() {
    resizing.set(true);
  }

  async function confirmResize() {
    if (!get(resizing)) {
      return;
    }

    resizing.set(false);

    const newEndMinutes = settings.getTimeFromYOffset(get(cursorOffsetY));

    await onUpdate({
      ...task,
      endMinutes: newEndMinutes,
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
