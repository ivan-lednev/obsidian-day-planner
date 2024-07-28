import { flow, uniqBy } from "lodash/fp";
import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { DayToTasks } from "../../../types";
import { getRenderKey } from "../../../util/task-utils";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";

export function useDisplayedTasksForDay(
  displayedTasks: Readable<DayToTasks>,
  day: Moment,
) {
  return derived(displayedTasks, ($displayedTasks) => {
    // todo: displayedTasks may be empty
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
