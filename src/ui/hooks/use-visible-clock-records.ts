import type { Moment } from "moment";
import { STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import type { TasksForDay } from "../../task-types";
import { toClockRecord } from "../../util/dataview";
import { getDayKey, getEmptyRecordsForDay } from "../../util/tasks-utils";

interface UseVisibleClockRecordsProps {
  dayToSTasksLookup: Readable<Record<string, STask[]>>;
  visibleDays: Readable<Moment[]>;
}

// TODO: remove duplication from Tasks
export function useVisibleClockRecords({
  dayToSTasksLookup,
  visibleDays,
}: UseVisibleClockRecordsProps) {
  return derived(
    [visibleDays, dayToSTasksLookup],
    ([$visibleDays, $dayToSTasksLookup]) => {
      return $visibleDays.reduce<Record<string, TasksForDay>>((result, day) => {
        const key = getDayKey(day);
        const sTasksForDay = $dayToSTasksLookup[key];

        if (sTasksForDay) {
          result[key] = {
            withTime: sTasksForDay.map(({ sTask, clockMoments }) =>
              toClockRecord(sTask, clockMoments),
            ),
            noTime: [],
          };
        } else {
          result[key] = getEmptyRecordsForDay();
        }

        return result;
      }, {});
    },
  );
}
