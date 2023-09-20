import type { Moment } from "moment";
import { derived, Readable } from "svelte/store";

import type { PlacedPlanItem, ReactiveSettingsWithUtils } from "../../types";
import { getRelationToNow } from "../../util/moment";
import { getEndTime } from "../../util/task-utils";

import { useColor } from "./use-color";

interface UseTaskProps {
  settings: ReactiveSettingsWithUtils;
  currentTime: Readable<Moment>;
}

export function useTask(
  task: PlacedPlanItem,
  { settings, currentTime }: UseTaskProps,
) {
  // todo: settings.settings is lame
  const useColorValues = useColor({ settings: settings.settings, task });

  const offset = derived(
    [settings.settings, settings.hiddenHoursSize],
    ([$settings, $hiddenHoursSize]) => {
      return task.startMinutes * $settings.zoomLevel - $hiddenHoursSize;
    },
  );

  const height = derived([settings.settings], ([$settings]) => {
    return task.durationMinutes * $settings.zoomLevel;
  });

  const relationToNow = derived([currentTime], ([$currentTime]) => {
    return getRelationToNow($currentTime, task.startTime, getEndTime(task));
  });

  return {
    offset,
    height,
    relationToNow,
    ...useColorValues,
  };
}
