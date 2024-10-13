import { differenceBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type { Task, WithTime } from "../../task-types";
import { getEndTime, getNotificationKey } from "../../util/task-utils";

interface UseNewlyStartedTasksProps {
  settings: Readable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  tasksForToday: Readable<Array<WithTime<Task>>>;
}

export function useNewlyStartedTasks(props: UseNewlyStartedTasksProps) {
  const { settings, currentTime, tasksForToday } = props;
  let previousTasksInProgress: Array<WithTime<Task>> = [];

  return derived([settings, currentTime], ([$settings, $currentTime]) => {
    if (!$settings.showTaskNotification) {
      return [];
    }

    const tasksInProgress = get(tasksForToday).filter((task) => {
      return (
        task.startTime.isBefore($currentTime) &&
        getEndTime(task).isAfter($currentTime)
      );
    });

    const newlyStarted = differenceBy(
      getNotificationKey,
      tasksInProgress,
      previousTasksInProgress,
    );

    previousTasksInProgress = tasksInProgress;

    return newlyStarted;
  });
}
