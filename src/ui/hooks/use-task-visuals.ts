import { derived, type Writable } from "svelte/store";

import { getHiddenHoursSize } from "../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../settings";
import type { Task, WithPlacing, WithTime } from "../../task-types";
import { getMinutesSinceMidnight } from "../../util/moment";

interface UseTaskVisualsProps {
  settings: Writable<DayPlannerSettings>;
}

// todo: useTaskPosition, move to one of stores, don't call inside component
export function useTaskVisuals(
  task: WithPlacing<WithTime<Task>>,
  { settings }: UseTaskVisualsProps,
) {
  const width = `${task.placing?.widthPercent || 100}%`;
  const left = `${task.placing?.xOffsetPercent || 0}%`;

  const offset = derived(settings, ($settings) => {
    const number =
      getMinutesSinceMidnight(task.startTime) * $settings.zoomLevel -
      getHiddenHoursSize($settings);

    return `${number}px`;
  });

  const height = derived(settings, ($settings) => {
    return `${task.durationMinutes * $settings.zoomLevel}px`;
  });

  return {
    width,
    left,
    offset,
    height,
  };
}
