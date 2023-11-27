import { uniqBy } from "lodash/fp";
import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { Tasks } from "../../../types";
import { getRenderKey } from "../../../util/task-utils";
import { getDayKey, getEmptyTasksForDay } from "../../../util/tasks-utils";

export function useDisplayedTasksForDay(
  displayedTasks: Readable<Tasks>,
  day: Moment,
) {
  return derived(displayedTasks, ($displayedTasks) => {
    const tasksForDay = $displayedTasks[getDayKey(day)];

    if (!tasksForDay) {
      return getEmptyTasksForDay();
    }

    return {
      ...tasksForDay,
      withTime: addHorizontalPlacing(
        uniqBy(getRenderKey, tasksForDay.withTime),
      ),
    };
  });
}
