import { Array } from "effect";
import type { Moment } from "moment";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type {
  PlanTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import { getEndTime, getNotificationKey } from "../../util/time-block-utils";

interface UseNewlyStartedTimeBlocksProps {
  settingsStore: Readable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  timeBlocksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
}

export function useNewlyStartedTimeBlocks(
  props: UseNewlyStartedTimeBlocksProps,
) {
  const { settingsStore, currentTime, timeBlocksWithTimeForToday } = props;
  let previousTimeBlocksInProgress: Array<WithDuration<PlanTimeBlock>> = [];

  return derived(
    [settingsStore, currentTime],
    ([$settingsStore, $currentTime]) => {
      if (!$settingsStore.showTaskNotification) {
        return [];
      }

      const timeBlocksInProgress = get(timeBlocksWithTimeForToday).filter<
        WithDuration<PlanTimeBlock>
      >(
        (timeBlock): timeBlock is PlanTimeBlock =>
          timeBlock.startTime.isBefore($currentTime) &&
          getEndTime(timeBlock).isAfter($currentTime) &&
          timeBlock.source !== "unwritten",
      );

      const newlyStarted = Array.differenceWith<WithDuration<PlanTimeBlock>>(
        (a, b) => getNotificationKey(a) === getNotificationKey(b),
      )(timeBlocksInProgress, previousTimeBlocksInProgress);

      previousTimeBlocksInProgress = timeBlocksInProgress;

      return newlyStarted;
    },
  );
}
