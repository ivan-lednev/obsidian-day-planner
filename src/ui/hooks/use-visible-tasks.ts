import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { settings } from "../../global-store/settings";
import { visibleDays } from "../../global-store/visible-days";
import { getScheduledDay } from "../../service/dataview-facade";
import { TasksForDay } from "../../types";
import { mapToTasksForDay } from "../../util/get-tasks-for-day";
import { getDayKey, getEmptyTasksForDay } from "../../util/tasks-utils";

interface UseVisibleTasksProps {
  dataviewTasks: Readable<DataArray<STask>>;
}

export function useVisibleTasks({ dataviewTasks }: UseVisibleTasksProps) {
  return derived(
    [visibleDays, dataviewTasks, settings],
    ([$visibleDays, $dataviewTasks, $settings]) => {
      // todo: make this simpler
      if ($dataviewTasks.length === 0) {
        return Object.fromEntries(
          $visibleDays.map((day) => [getDayKey(day), getEmptyTasksForDay()]),
        );
      }

      const dayToSTasksLookup: Record<string, STask[]> = Object.fromEntries(
        $dataviewTasks
          .groupBy(getScheduledDay)
          .map(({ key, rows }) => [key, rows.array()])
          .array(),
      );

      return $visibleDays.reduce<Record<string, TasksForDay>>((result, day) => {
        const key = getDayKey(day);
        const sTasksForDay = dayToSTasksLookup[key];

        if (sTasksForDay) {
          result[key] = mapToTasksForDay(day, sTasksForDay, $settings);
        } else {
          result[key] = getEmptyTasksForDay();
        }

        return result;
      }, {});
    },
  );
}
