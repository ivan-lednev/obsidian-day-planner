import { flow, uniqBy } from "lodash/fp";
import type { Moment } from "moment/moment";
import { derived, type Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import type { DayToTasks } from "../../../types";
import { getRenderKey } from "../../../util/task-utils";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";

export function useDisplayedTasksForDay(
  displayedTasks: Readable<DayToTasks>,
  day: Moment,
) {
  return derived(displayedTasks, ($displayedTasks) => {
    const tasksForDay = $displayedTasks[getDayKey(day)];

    if (!tasksForDay) {
      return getEmptyRecordsForDay();
    }

    const withTime = flow(
      uniqBy(getRenderKey),
      (task) => task,
      addHorizontalPlacing,
    )(tasksForDay.withTime);

    return {
      ...tasksForDay,
      withTime,
    };
  });
}
