import { groupBy } from "lodash/fp";
import type { Moment } from "moment";
import { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import { settings } from "../../global-store/settings";
import type { PeriodicNotes } from "../../service/periodic-notes";
import type { LocalTask } from "../../task-types";
import { getScheduledDay } from "../../util/dataview";
import { mapToTasksForDay } from "../../util/get-tasks-for-day";
import { getDayKey } from "../../util/task-utils";

export function useVisibleDataviewTasks(
  dataviewTasks: Readable<STask[]>,
  visibleDays: Readable<Moment[]>,
  periodicNotes: PeriodicNotes,
) {
  return derived(
    [visibleDays, dataviewTasks, settings],
    ([$visibleDays, $dataviewTasks, $settings]) => {
      const dayToSTasks = groupBy(
        (sTask) => getScheduledDay({ sTask, periodicNotes }),
        $dataviewTasks,
      );

      return $visibleDays.reduce<LocalTask[]>((result, day) => {
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
