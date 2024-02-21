import { App } from "obsidian";
import { DataArray, STask } from "obsidian-dataview";
import { derived, get, readable, Readable, Writable } from "svelte/store";

import { reQueryAfterMillis } from "../constants";
import { currentTime } from "../global-store/current-time";
import { DataviewFacade } from "../service/dataview-facade";
import { ObsidianFacade } from "../service/obsidian-facade";
import { PlanEditor } from "../service/plan-editor";
import { DayPlannerSettings } from "../settings";
import { useDataviewChange } from "../ui/hooks/use-dataview-change";
import { useDataviewLoaded } from "../ui/hooks/use-dataview-loaded";
import { useDayToScheduledStasks } from "../ui/hooks/use-day-to-scheduled-stasks";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useEditContext } from "../ui/hooks/use-edit/use-edit-context";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useModPressed } from "../ui/hooks/use-mod-pressed";
import { useNewlyStartedTasks } from "../ui/hooks/use-newly-started-tasks";
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
  const isModPressed = useModPressed();
  const dataviewChange = useDataviewChange(app.metadataCache);
  const dataviewLoaded = useDataviewLoaded(app);
  // todo: move out
  const layoutReady = readable(false, (set) => {
    app.workspace.onLayoutReady(() => set(true));
  });

  const taskUpdateTrigger = derived(
    [dataviewChange, dataviewSource],
    getUpdateTrigger,
  );
  const debouncedTaskUpdateTrigger = useDebounceWithDelay(
    taskUpdateTrigger,
    keyDown,
    reQueryAfterMillis,
  );
  const visibleDailyNotes = useVisibleDailyNotes(layoutReady);

  // todo: move out
  const listsFromVisibleDailyNotes = derived(
    [visibleDailyNotes, dataviewLoaded, debouncedTaskUpdateTrigger],
    ([$visibleDailyNotes, $dataviewLoaded]) => {
      if (!$dataviewLoaded || $visibleDailyNotes.length === 0) {
        return [];
      }

      return dataviewFacade.getAllListsFrom(query.anyOf($visibleDailyNotes));
    },
  );

  // todo: move out
  const tasksFromExtraSources = derived(
    [dataviewSource, dataviewLoaded, debouncedTaskUpdateTrigger],
    ([$dataviewSource, $dataviewLoaded]) => {
      const noAdditionalSource = $dataviewSource.trim().length === 0;

      if (noAdditionalSource || !$dataviewLoaded) {
        return [];
      }

      const queryFromExtraSources = query.andNot(
        $dataviewSource,
        query.anyOf(get(visibleDailyNotes)),
      );

      return dataviewFacade.getAllTasksFrom(queryFromExtraSources);
    },
  );

  // todo: move out
  const dataviewTasks: Readable<DataArray<STask>> = derived(
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

  const dayToSTasksLookup = useDayToScheduledStasks({ dataviewTasks });

  const visibleTasks = useVisibleTasks({ dayToSTasksLookup });
  const tasksForToday = derived(
    [visibleTasks, currentTime],
    ([$visibleTasks, $currentTime]) => {
      return $visibleTasks[getDayKey($currentTime)];
    },
  );

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

  const newlyStartedTasks = useNewlyStartedTasks({
    settings: settingsStore,
    tasksForToday,
    currentTime,
  });

  return {
    editContext,
    tasksForToday,
    visibleTasks,
    dataviewLoaded,
    newlyStartedTasks,
    isModPressed,
  };
}
