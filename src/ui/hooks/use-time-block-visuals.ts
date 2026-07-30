import { derived, type Writable } from "svelte/store";

import { momentToTimelineOffset } from "../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../settings";
import type {
  TimeBlock,
  WithPlacing,
  WithDuration,
} from "../../time-block-types";

interface UseTimeBlockVisualsProps {
  settingsStore: Writable<DayPlannerSettings>;
}

// todo: useTimeBlockPosition, move to one of stores, don't call inside component
export function useTimeBlockVisuals(
  timeBlock: WithPlacing<WithDuration<TimeBlock>>,
  { settingsStore }: UseTimeBlockVisualsProps,
) {
  const width = `${timeBlock.placing?.spanPercent || 100}%`;
  const left = `${timeBlock.placing?.offsetPercent || 0}%`;

  const offset = derived(settingsStore, ($settingsStore) => {
    return `${momentToTimelineOffset(timeBlock.startTime, $settingsStore)}px`;
  });

  const height = derived(settingsStore, ($settingsStore) => {
    return `${timeBlock.durationMinutes * $settingsStore.zoomLevel}px`;
  });

  return {
    width,
    left,
    offset,
    height,
  };
}
