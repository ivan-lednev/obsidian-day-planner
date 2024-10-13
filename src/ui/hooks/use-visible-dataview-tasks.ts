import { groupBy } from "lodash/fp";
import type { Moment } from "moment";
import { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { settings } from "../../global-store/settings";
import type { Task, TasksForDay } from "../../task-types";
import { getScheduledDay } from "../../util/dataview";
import { mapToTasksForDay } from "../../util/get-tasks-for-day";
import { getDayKey, getEmptyRecordsForDay } from "../../util/tasks-utils";

export function useVisibleDataviewTasks(
  dataviewTasks: Readable<STask[]>,
  visibleDays: Readable<Moment[]>,
) {
  return derived(
    [visibleDays, dataviewTasks, settings],
    ([$visibleDays, $dataviewTasks, $settings]) => {
      // todo: this looks wrong
      const dayToSTasks = groupBy(getScheduledDay, $dataviewTasks);

      return $visibleDays.reduce<Task[]>((result, day) => {
        const key = getDayKey(day);
        const sTasksForDay = dayToSTasks[key];

        if (sTasksForDay) {
          return result.concat(mapToTasksForDay(day, sTasksForDay, $settings));
        }

        return result;
      }, []);
    },
  );
}
