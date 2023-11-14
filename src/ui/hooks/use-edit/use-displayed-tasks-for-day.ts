import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { Tasks } from "../../../types";
import { getEmptyTasksForDay } from "../../../util/tasks-utils";

import { getDayKey } from "./transform/drag-and-shift-others";

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
      withTime: addHorizontalPlacing(tasksForDay.withTime),
    };
  });
}
