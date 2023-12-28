import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";
import { createClockRecord } from "../../service/dataview-facade";
import { TasksForDay } from "../../types";
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
        // TODO: this may produce tasks for multiple days

        if (sTasksForDay) {
          result[key] = {
            withTime: sTasksForDay.map(({ sTask, moments }) =>
              createClockRecord(sTask, moments),
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
