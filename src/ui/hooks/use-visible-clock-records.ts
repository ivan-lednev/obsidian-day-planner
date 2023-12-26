import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";
import { TasksForDay } from "../../types";
import { toClockRecords } from "../../util/clock";
import { getDayKey, getEmptyRecordsForDay } from "../../util/tasks-utils";

interface UseVisibleClockRecordsProps {
  dayToSTasksLookup: Readable<Record<string, STask[]>>;
}

// todo: remove duplication from Tasks
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
            withTime: toClockRecords(sTasksForDay),
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
