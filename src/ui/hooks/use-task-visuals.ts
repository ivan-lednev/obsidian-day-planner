import type { Moment } from "moment";
import { derived, type Readable, type Writable } from "svelte/store";

import { getHiddenHoursSize } from "../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../settings";
import type { Task, WithPlacing, WithTime } from "../../task-types";
import { getRelationToNow } from "../../util/moment";
import { getEndTime } from "../../util/task-utils";

import { useColor } from "./use-color";

interface UseTaskVisualsProps {
  settings: Writable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
}

// todo: useTaskPosition, move to one of stores, don't call inside component
export function useTaskVisuals(
  task: WithPlacing<WithTime<Task>>,
  { settings, currentTime }: UseTaskVisualsProps,
) {
  const relationToNow = derived(currentTime, ($currentTime) => {
    return getRelationToNow($currentTime, task.startTime, getEndTime(task));
  });

  const color = useColor({ settings, task, relationToNow });

  const width = `${task.placing?.widthPercent || 100}%`;
  const left = `${task.placing?.xOffsetPercent || 0}%`;

  const offset = derived(settings, ($settings) => {
    const number =
      task.startMinutes * $settings.zoomLevel - getHiddenHoursSize($settings);

    return `${number}px`;
  });

  const height = derived(settings, ($settings) => {
    return `${task.durationMinutes * $settings.zoomLevel}px`;
  });

  return {
    ...color,
    width,
    left,
    offset,
    height,
  };
}
