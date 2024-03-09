import { flow, uniqBy } from "lodash/fp";
import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { Tasks } from "../../../types";
import { getRenderKey } from "../../../util/task-utils";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";

export function useDisplayedTasksForDay(
  displayedTasks: Readable<Tasks>,
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
