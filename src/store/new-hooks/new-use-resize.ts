import { get, Readable, writable } from "svelte/store";

import type { PlanItem } from "../../types";
import { snap } from "../timeline-store";

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

    const newEndMinutes = settings.getTimeFromYOffset(
      // todo: duplication
      snap(Math.floor(get(cursorOffsetY)), get(settings.settings).zoomLevel),
    );

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
