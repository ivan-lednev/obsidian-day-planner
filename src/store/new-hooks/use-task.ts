import type { Moment } from "moment";
import { derived, Readable } from "svelte/store";

import type { PlanItem } from "../../types";
import { getRelationToNow } from "../../util/moment";

import type { ReactiveSettingsWithUtils } from "./new-use-drag";
import { useDrag } from "./new-use-drag";
import { useResize } from "./new-use-resize";
import { useColor } from "./use-color";

interface UseTaskProps {
  settings: ReactiveSettingsWithUtils;
  currentTime: Readable<Moment>;
  cursorOffsetY: Readable<number>;
  onUpdate: (updated: PlanItem) => Promise<void>;
}

export function useTask(
  task: PlanItem,
  { settings, currentTime, cursorOffsetY, onUpdate }: UseTaskProps,
) {
  const { dragging, ...useDragValues } = useDrag({
    settings,
    cursorOffsetY,
    task,
    onUpdate,
  });

  const { resizing, ...useResizeValues } = useResize({
    settings,
    task,
    cursorOffsetY,
    onUpdate,
  });

  const useColorValues = useColor({ settings, task });

  const initialOffset = derived(
    // todo: not sure if this is the cleanest way
    [settings.settings, settings.hiddenHoursSize],
    ([$settings, $hiddenHoursSize]) => {
      return task.startMinutes * $settings.zoomLevel - $hiddenHoursSize;
    },
  );

  const offset = derived(
    [dragging, initialOffset, cursorOffsetY],
    ([$dragging, $initialOffset, $cursorOffsetY]) => {
      return $dragging ? $cursorOffsetY : $initialOffset;
    },
  );

  const initialHeight = derived([settings.settings], ([$settings]) => {
    return task.durationMinutes * $settings.zoomLevel;
  });

  const height = derived(
    [resizing, initialHeight, offset, cursorOffsetY],
    ([$resizing, $initialHeight, $offset, $cursorOffsetY]) => {
      return $resizing ? $cursorOffsetY - $offset : $initialHeight;
    },
  );

  const relationToNow = derived([currentTime], ([$currentTime]) => {
    return getRelationToNow($currentTime, task.startTime, task.endTime);
  });

  return {
    offset,
    height,
    relationToNow,
    dragging,
    ...useDragValues,
    ...useResizeValues,
    ...useColorValues,
  };
}
