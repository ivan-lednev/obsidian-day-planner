import { DataArray, STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../../settings";

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
      const allTasks =
        $tasksFromExtraSources.length > 0
          ? // todo: this looks silly
            $listsFromVisibleDailyNotes.concat($tasksFromExtraSources)
          : $listsFromVisibleDailyNotes;

      if ($settingsStore.showCompletedTasks) {
        return allTasks;
      }

      return allTasks.filter((sTask: STask) => !sTask.completed);
    },
  );
}
