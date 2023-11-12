import { Moment } from "moment/moment";
import { derived, Readable } from "svelte/store";

import { Tasks } from "../../../types";
import { getEmptyTasksForDay } from "../../../util/tasks-utils";

import { getDayKey } from "./transform/drag-and-shift-others";

export function useDisplayedTasksForDay(
  displayedTasks: Readable<Tasks>,
  day: Moment,
) {
  return derived(displayedTasks, ($displayedTasks) => {
    return $displayedTasks[getDayKey(day)] || getEmptyTasksForDay();
  });
}
