import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { settings } from "../../global-store/settings";
import { visibleDays } from "../../global-store/visible-days";
import { TasksForDay } from "../../types";
import { mapToTasksForDay } from "../../util/get-tasks-for-day";
import { getDayKey, getEmptyRecordsForDay } from "../../util/tasks-utils";

interface UseVisibleTasksProps {
  dayToSTasksLookup: Readable<Record<string, STask[]>>;
}

export function useVisibleTasks({ dayToSTasksLookup }: UseVisibleTasksProps) {
  return derived(
    [visibleDays, dayToSTasksLookup, settings],
    ([$visibleDays, $dayToSTasksLookup, $settings]) => {
      return $visibleDays.reduce<Record<string, TasksForDay>>((result, day) => {
        const key = getDayKey(day);
        const sTasksForDay = $dayToSTasksLookup[key];

        if (sTasksForDay) {
          result[key] = mapToTasksForDay(day, sTasksForDay, $settings);
        } else {
          result[key] = getEmptyRecordsForDay();
        }

        return result;
      }, {});
    },
  );
}
