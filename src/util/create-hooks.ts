import { noop } from "lodash/fp";
import { Moment } from "moment/moment";
import { App } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataArray, STask } from "obsidian-dataview";
import { Writable, derived, Readable } from "svelte/store";

import { currentTime } from "../global-store/current-time";
import { visibleDays } from "../global-store/visible-days";
import { DataviewFacade } from "../service/dataview-facade";
import { ObsidianFacade } from "../service/obsidian-facade";
import { PlanEditor } from "../service/plan-editor";
import { DayPlannerSettings } from "../settings";
import { useDayToScheduledStasks } from "../ui/hooks/use-day-to-scheduled-stasks";
import { useDayToStasksWithClockMoments } from "../ui/hooks/use-day-to-stasks-with-clock-moments";
import { useDebouncedDataviewTasks } from "../ui/hooks/use-debounced-dataview-tasks";
import { useEditContext } from "../ui/hooks/use-edit/use-edit-context";
import { useStasksWithActiveClockProps } from "../ui/hooks/use-stasks-with-active-clock-props";
import { useVisibleClockRecords } from "../ui/hooks/use-visible-clock-records";
import { useVisibleTasks } from "../ui/hooks/use-visible-tasks";

import { getDayKey } from "./tasks-utils";

interface CreateHooksProps {
  app: App;
  dataviewFacade: DataviewFacade;
  obsidianFacade: ObsidianFacade;
  settingsStore: Writable<DayPlannerSettings>;
  planEditor: PlanEditor;
}

// todo: move out
export function useVisibleDailyNotes() {
  return derived(visibleDays, ($visibleDays) => {
    const allDailyNotes = getAllDailyNotes();

    return $visibleDays
      .map((day) => getDailyNote(day, allDailyNotes))
      .filter(Boolean);
  });
}

export function createHooks({
  app,
  dataviewFacade,
  obsidianFacade,
  settingsStore,
  planEditor,
}: CreateHooksProps) {
  const visibleDailyNotes = useVisibleDailyNotes();
  const dataviewTasks: Readable<DataArray<STask>> = useDebouncedDataviewTasks({
    visibleDailyNotes,
    settings: settingsStore,
    metadataCache: app.metadataCache,
    getAllTasksFrom: dataviewFacade.getAllTasksFrom,
    getAllListsFrom: dataviewFacade.getAllListsFrom,
  });
  const dayToSTasksLookup = useDayToScheduledStasks({ dataviewTasks });
  const visibleTasks = useVisibleTasks({ dayToSTasksLookup });
  const tasksForToday = derived(
    [visibleTasks, currentTime],
    ([$visibleTasks, $currentTime]) => {
      return $visibleTasks[getDayKey($currentTime)];
    },
  );

  const sTasksWithActiveClockProps = useStasksWithActiveClockProps({
    dataviewTasks,
  });
  const dayToStasksWithClockMoments = useDayToStasksWithClockMoments({
    dataviewTasks,
  });
  const visibleClockRecords = useVisibleClockRecords({
    dayToSTasksLookup: dayToStasksWithClockMoments,
  });

  // TODO: unwrap the hook from the derived store to remove extra-indirection
  const editContext = derived(
    [settingsStore, visibleTasks],
    ([$settings, $visibleTasks]) => {
      return useEditContext({
        obsidianFacade,
        onUpdate: planEditor.syncTasksWithFile,
        settings: $settings,
        visibleTasks: $visibleTasks,
      });
    },
  );

  // TODO: remove duplication
  const timeTrackerEditContext = derived(
    [settingsStore, visibleClockRecords],
    ([$settings, $visibleClockRecords]) => {
      const base = useEditContext({
        obsidianFacade,
        onUpdate: planEditor.syncTasksWithFile,
        settings: $settings,
        visibleTasks: $visibleClockRecords,
      });

      function withDisabledEditHandlers(day: Moment) {
        return {
          ...base.getEditHandlers(day),
          handleGripMouseDown: noop,
          handleContainerMouseDown: noop,
          handleResizerMouseDown: noop,
        };
      }

      return {
        ...base,
        getEditHandlers: withDisabledEditHandlers,
      };
    },
  );

  return {
    timeTrackerEditContext,
    editContext,
    tasksForToday,
    sTasksWithActiveClockProps,
    visibleTasks,
  };
}
