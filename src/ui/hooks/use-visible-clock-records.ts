import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";
import { TasksForDay } from "../../types";
import { toClockRecord } from "../../util/dataview";
import { getDayKey, getEmptyRecordsForDay } from "../../util/tasks-utils";

interface UseVisibleClockRecordsProps {
  dayToSTasksLookup: Readable<Record<string, STask[]>>;
}

// TODO: remove duplication from Tasks
export function useVisibleClockRecords({
  dayToSTasksLookup,
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
