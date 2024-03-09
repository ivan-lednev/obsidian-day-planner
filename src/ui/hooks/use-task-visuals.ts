import type { Moment } from "moment";
import { derived, Readable, Writable } from "svelte/store";

import { getHiddenHoursSize } from "../../global-store/derived-settings";
import { DayPlannerSettings } from "../../settings";
import type { Task } from "../../types";
import { getRelationToNow } from "../../util/moment";
import { getEndTime } from "../../util/task-utils";

import { useColor } from "./use-color";

interface UseTaskVisualsProps {
  settings: Writable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
}

const defaultBorderColor = "var(--color-base-50)";

export function useTaskVisuals(
  task: Task,
  { settings, currentTime }: UseTaskVisualsProps,
) {
  const useColorValues = useColor({ settings, task });
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

  const relationToNow = derived(currentTime, ($currentTime) => {
    return getRelationToNow($currentTime, task.startTime, getEndTime(task));
  });

  const backgroundColor = derived(relationToNow, ($relationToNow) => {
    return $relationToNow === "past"
      ? "var(--background-secondary)"
      : "var(--background-primary)";
  });

  const borderColor = derived(relationToNow, ($relationToNow) => {
    return $relationToNow === "present"
      ? "var(--color-accent)"
      : defaultBorderColor;
  });

  return {
    ...useColorValues,
    width,
    left,
    offset,
    height,
    borderColor,
    backgroundColor,
  };
}
