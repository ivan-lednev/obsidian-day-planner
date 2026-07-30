import { derived, type Writable } from "svelte/store";

import { momentToTimelineOffset } from "../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../settings";
import type {
  TimeBlock,
  WithPlacing,
  WithDuration,
} from "../../time-block-types";

interface UseTimeBlockVisualsProps {
  settings: Writable<DayPlannerSettings>;
}

// todo: useTimeBlockPosition, move to one of stores, don't call inside component
export function useTimeBlockVisuals(
  timeBlock: WithPlacing<WithDuration<TimeBlock>>,
  { settings }: UseTimeBlockVisualsProps,
) {
  const width = `${timeBlock.placing?.spanPercent || 100}%`;
  const left = `${timeBlock.placing?.offsetPercent || 0}%`;

  const offset = derived(settings, ($settings) => {
    return `${momentToTimelineOffset(timeBlock.startTime, $settings)}px`;
  });

  const height = derived(settings, ($settings) => {
    return `${timeBlock.durationMinutes * $settings.zoomLevel}px`;
  });

  return {
    width,
    left,
    offset,
    height,
  };
}
