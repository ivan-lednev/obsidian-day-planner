import type { Moment } from "moment";
import { derived, Readable } from "svelte/store";

import { snap } from "../../global-stores/settings-utils";
import type { PlacedPlanItem, PlanItem } from "../../types";
import { getRelationToNow } from "../../util/moment";

import { useColor } from "./use-color";
import type { ReactiveSettingsWithUtils } from "./use-drag";

interface UseTaskProps {
  settings: ReactiveSettingsWithUtils;
  currentTime: Readable<Moment>;
  cursorOffsetY: Readable<number>;
  onMouseUp: (planItem: PlanItem) => Promise<void>;
}

export function useTask(
  task: PlacedPlanItem,
  { settings, currentTime, cursorOffsetY, onMouseUp }: UseTaskProps,
) {
  // todo: settings.settings is lame
  const useColorValues = useColor({ settings: settings.settings, task });

  const initialOffset = derived(
    // todo: not sure if this is the cleanest way
    [settings.settings, settings.hiddenHoursSize],
    ([$settings, $hiddenHoursSize]) => {
      return task.startMinutes * $settings.zoomLevel - $hiddenHoursSize;
    },
  );

  const offset = derived(
    [initialOffset, cursorOffsetY, settings.settings],
    ([$initialOffset, $cursorOffsetY, $settings]) => {
      if (task.isGhost) {
        return snap(Math.floor($cursorOffsetY), $settings.zoomLevel);
      }

      return $initialOffset;
    },
  );

  const height = derived([settings.settings], ([$settings]) => {
    return task.durationMinutes * $settings.zoomLevel;
  });

  const relationToNow = derived([currentTime], ([$currentTime]) => {
    return getRelationToNow($currentTime, task.startTime, task.endTime);
  });

  async function handleMouseUp() {
    if (task.isGhost) {
      return;
    }

    await onMouseUp(task);
  }

  return {
    offset,
    height,
    relationToNow,
    handleMouseUp,
    ...useColorValues,
  };
}
