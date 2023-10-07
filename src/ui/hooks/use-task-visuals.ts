import type { Moment } from "moment";
import { derived, Readable, Writable } from "svelte/store";

import { getHiddenHoursSize } from "../../global-store/settings-utils";
import { DayPlannerSettings } from "../../settings";
import type { PlacedPlanItem } from "../../types";
import { getRelationToNow } from "../../util/moment";
import { getEndTime } from "../../util/task-utils";

import { useColor } from "./use-color";

interface UseTaskVisualsProps {
  settings: Writable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
}

export function useTaskVisuals(
  task: PlacedPlanItem,
  { settings, currentTime }: UseTaskVisualsProps,
) {
  const useColorValues = useColor({ settings, task });

  const offset = derived(settings, ($settings) => {
    return (
      task.startMinutes * $settings.zoomLevel - getHiddenHoursSize($settings)
    );
  });

  const height = derived(settings, ($settings) => {
    return task.durationMinutes * $settings.zoomLevel;
  });

  const relationToNow = derived(currentTime, ($currentTime) => {
    return getRelationToNow($currentTime, task.startTime, getEndTime(task));
  });

  return {
    offset,
    height,
    relationToNow,
    ...useColorValues,
  };
}
