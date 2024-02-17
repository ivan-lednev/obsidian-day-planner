import { noop } from "lodash/fp";
import { Moment } from "moment/moment";
import { App } from "obsidian";
import { derived, Writable } from "svelte/store";

import { reQueryAfterMillis } from "../constants";
import { currentTime } from "../global-store/current-time";
import { DataviewFacade } from "../service/dataview-facade";
import { ObsidianFacade } from "../service/obsidian-facade";
import { PlanEditor } from "../service/plan-editor";
import { DayPlannerSettings } from "../settings";
import { useDataviewChange } from "../ui/hooks/use-dataview-change";
import { useDataviewLoaded } from "../ui/hooks/use-dataview-loaded";
import { useDayToScheduledStasks } from "../ui/hooks/use-day-to-scheduled-stasks";
import { useDayToStasksWithClockMoments } from "../ui/hooks/use-day-to-stasks-with-clock-moments";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useEditContext } from "../ui/hooks/use-edit/use-edit-context";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useStasksWithActiveClockProps } from "../ui/hooks/use-stasks-with-active-clock-props";
import { useVisibleClockRecords } from "../ui/hooks/use-visible-clock-records";
import { useVisibleDailyNotes } from "../ui/hooks/use-visible-daily-notes";
import { useVisibleTasks } from "../ui/hooks/use-visible-tasks";

import * as query from "./dataview-query";
import { getUpdateTrigger } from "./store";
import { getDayKey } from "./tasks-utils";

interface CreateHooksProps {
  app: App;
  dataviewFacade: DataviewFacade;
  obsidianFacade: ObsidianFacade;
  settingsStore: Writable<DayPlannerSettings>;
  planEditor: PlanEditor;
}

export function createHooks({
  app,
  dataviewFacade,
  obsidianFacade,
  settingsStore,
  planEditor,
}: CreateHooksProps) {
  const dataviewSource = derived(settingsStore, ($settings) => {
    return $settings.dataviewSource;
  });
  const keyDown = useKeyDown();
  const dataviewChange = useDataviewChange(app.metadataCache);
  const dataviewLoaded = useDataviewLoaded(app);

  const taskUpdateTrigger = derived(
    [dataviewChange, dataviewSource],
    getUpdateTrigger,
  );
  const debouncedTaskUpdateTrigger = useDebounceWithDelay(
    taskUpdateTrigger,
    keyDown,
    reQueryAfterMillis,
  );
  const visibleDailyNotes = useVisibleDailyNotes(dataviewLoaded);

  // const listsFromVisibleDailyNotes = derived(
  const dataviewTasks = derived(
    [visibleDailyNotes, dataviewLoaded, debouncedTaskUpdateTrigger],
    ([$visibleDailyNotes, $dataviewLoaded]) => {
      if (!$dataviewLoaded) {
        return [];
      }

      return dataviewFacade.getAllListsFrom(query.anyOf($visibleDailyNotes));
    },
  );

  // const dataviewTasks: Readable<DataArray<STask>> = useDebouncedDataviewTasks({
  //   visibleDailyNotes,
  //   settings: settingsStore,
  //   metadataCache: app.metadataCache,
  //   dataviewFacade,
  // });

  const dayToSTasksLookup = useDayToScheduledStasks({ dataviewTasks });

  // todo: we might not need this any longer
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
    dataviewLoaded,
  };
}
