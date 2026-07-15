import { differenceBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type {
  PlanTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import { getEndTime, getNotificationKey } from "../../util/time-block-utils";

interface UseNewlyStartedTasksProps {
  settings: Readable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  tasksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
}

export function useNewlyStartedTasks(props: UseNewlyStartedTasksProps) {
  const { settings, currentTime, tasksWithTimeForToday } = props;
  let previousTasksInProgress: Array<WithDuration<PlanTimeBlock>> = [];

  return derived([settings, currentTime], ([$settings, $currentTime]) => {
    if (!$settings.showTaskNotification) {
      return [];
    }

    const tasksInProgress = get(tasksWithTimeForToday).filter<
      WithDuration<PlanTimeBlock>
    >(
      (task): task is PlanTimeBlock =>
        task.startTime.isBefore($currentTime) &&
        getEndTime(task).isAfter($currentTime) &&
        task.source !== "unwritten",
    );

    const newlyStarted = differenceBy(
      getNotificationKey,
      tasksInProgress,
      previousTasksInProgress,
    );

    previousTasksInProgress = tasksInProgress;

    return newlyStarted;
  });
}
