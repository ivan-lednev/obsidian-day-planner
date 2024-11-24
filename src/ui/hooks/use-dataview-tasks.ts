import { DataArray, STask } from "obsidian-dataview";
import { derived, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import * as dv from "../../util/dataview";

interface UseDataviewTasksProps {
  listsFromVisibleDailyNotes: Readable<DataArray<STask>>;
  tasksFromExtraSources: Readable<DataArray<STask>>;
  settingsStore: Readable<DayPlannerSettings>;
}

export function useDataviewTasks({
  listsFromVisibleDailyNotes,
  tasksFromExtraSources,
  settingsStore,
}: UseDataviewTasksProps) {
  return derived(
    [listsFromVisibleDailyNotes, tasksFromExtraSources, settingsStore],
    ([$listsFromVisibleDailyNotes, $tasksFromExtraSources, $settingsStore]) => {
      const allTasks = dv.uniq(
        $listsFromVisibleDailyNotes.concat($tasksFromExtraSources),
      );

      return $settingsStore.showCompletedTasks
        ? allTasks
        : allTasks.filter((sTask: STask) => !sTask.completed);
    },
  );
}
