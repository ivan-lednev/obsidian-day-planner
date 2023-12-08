import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { visibleDays } from "../../global-store/visible-days";
import { TasksForDay } from "../../types";
import { getDayKey, getEmptyTasksForDay } from "../../util/tasks-utils";

import { sTaskToClocks } from "./use-clocks";

interface UseVisibleClockRecordsProps {
  dayToSTasksLookup: Readable<Record<string, STask[]>>;
}

// todo: move
export function mapToClockRecords(sTasks: STask[]) {
  return sTasks
    .filter((task) => task.clocked)
    .flatMap((sTask) => sTaskToClocks(sTask, sTask.clocked))
    .filter(Boolean);
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
            withTime: mapToClockRecords(sTasksForDay),
            noTime: [],
          };
        } else {
          result[key] = getEmptyTasksForDay();
        }

        return result;
      }, {});
    },
  );
}
