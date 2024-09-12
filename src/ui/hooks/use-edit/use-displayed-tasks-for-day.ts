import { flow, uniqBy } from "lodash/fp";
import type { Moment } from "moment/moment";
import { derived, type Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import type {
  DayToTasks,
  Task,
  WithPlacing,
  WithTime,
} from "../../../task-types";
import { getRenderKey } from "../../../util/task-utils";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";

export function useDisplayedTasksForDay(
  displayedTasks: Readable<DayToTasks>,
  day: Moment,
) {
  return derived(displayedTasks, ($displayedTasks) => {
    const tasksForDay =
      $displayedTasks[getDayKey(day)] || getEmptyRecordsForDay();

    const withTime: Array<WithPlacing<WithTime<Task>>> = flow(
      uniqBy(getRenderKey),
      addHorizontalPlacing,
    )(tasksForDay.withTime);

    return {
      ...tasksForDay,
      withTime,
    };
  });
}
