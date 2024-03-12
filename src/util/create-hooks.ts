import {
  filter,
  flatten,
  flow,
  groupBy,
  mapValues,
  partition,
} from "lodash/fp";
import { App } from "obsidian";
import { derived, readable, writable, Writable } from "svelte/store";

import { icalRefreshIntervalMillis, reQueryAfterMillis } from "../constants";
import { currentTime } from "../global-store/current-time";
import { visibleDays } from "../global-store/visible-days";
import { DataviewFacade } from "../service/dataview-facade";
import { ObsidianFacade } from "../service/obsidian-facade";
import { PlanEditor } from "../service/plan-editor";
import { DayPlannerSettings } from "../settings";
import { Task, UnscheduledTask } from "../types";
import { useDataviewChange } from "../ui/hooks/use-dataview-change";
import { useDataviewLoaded } from "../ui/hooks/use-dataview-loaded";
import { useDataviewTasks } from "../ui/hooks/use-dataview-tasks";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useEditContext } from "../ui/hooks/use-edit/use-edit-context";
import { useIsOnline } from "../ui/hooks/use-is-online";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useListsFromVisibleDailyNotes } from "../ui/hooks/use-lists-from-visible-daily-notes";
import { useModPressed } from "../ui/hooks/use-mod-pressed";
import { useNewlyStartedTasks } from "../ui/hooks/use-newly-started-tasks";
import { useTasksFromExtraSources } from "../ui/hooks/use-tasks-from-extra-sources";
import { useVisibleDailyNotes } from "../ui/hooks/use-visible-daily-notes";
import { useVisibleDataviewTasks } from "../ui/hooks/use-visible-dataview-tasks";

import { canHappenAfter, icalEventToTasks } from "./ical";
import { getEarliestMoment } from "./moment";
import { createBackgroundBatchScheduler } from "./scheduler";
import { getUpdateTrigger } from "./store";
import { getDayKey, mergeTasks } from "./tasks-utils";
import { useIcalEvents } from "./use-ical-events";

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
  const layoutReady = readable(false, (set) => {
    app.workspace.onLayoutReady(() => set(true));
  });

  // todo: these can be global stores
  const keyDown = useKeyDown();
  const isModPressed = useModPressed();
  const isOnline = useIsOnline();
  // ---

  const dataviewChange = useDataviewChange(app.metadataCache);
  const dataviewLoaded = useDataviewLoaded(app);

  const icalRefreshTimer = readable(getUpdateTrigger(), (set) => {
    const interval = setInterval(() => {
      set(getUpdateTrigger());
    }, icalRefreshIntervalMillis);

    return () => {
      clearInterval(interval);
    };
  });

  const icalSyncTrigger = writable();
  const combinedIcalSyncTrigger = derived(
    [icalRefreshTimer, icalSyncTrigger],
    getUpdateTrigger,
  );

  const icalEvents = useIcalEvents(
    settingsStore,
    combinedIcalSyncTrigger,
    isOnline,
  );

  // todo: improve naming
  const schedulerQueue = derived(
    [icalEvents, visibleDays],
    ([$icalEvents, $visibleDays]) => {
      if (!$icalEvents) {
        return [];
      }

      const earliestDay = getEarliestMoment($visibleDays);
      const startOfEarliestDay = earliestDay.clone().startOf("day").toDate();
      const relevantIcalEvents = $icalEvents.filter((icalEvent) =>
        canHappenAfter(icalEvent, startOfEarliestDay),
      );

      // todo: make it easier to understand
      return relevantIcalEvents.flatMap((icalEvent) => {
        return $visibleDays.map(
          (day) => () => icalEventToTasks(icalEvent, day),
        );
      });
    },
  );

  const tasksFromEvents = readable<Array<ReturnType<typeof icalEventToTasks>>>(
    [],
    (set) => {
      const scheduler =
        createBackgroundBatchScheduler<ReturnType<typeof icalEventToTasks>>(
          set,
        );

      return schedulerQueue.subscribe(scheduler.enqueueTasks);
    },
  );

  const visibleDayToEventOccurences = derived(
    tasksFromEvents,
    // todo: move out
    flow(
      filter(Boolean),
      flatten,
      groupBy((task: Task) => getDayKey(task.startTime)),
      mapValues((tasks) => {
        const [withTime, noTime]: [Task[], UnscheduledTask[]] = partition(
          (task) => task.startMinutes !== undefined,
          tasks,
        );

        return { withTime, noTime };
      }),
    ),
  );

  const taskUpdateTrigger = derived(
    [dataviewChange, dataviewSource],
    getUpdateTrigger,
  );
  const debouncedTaskUpdateTrigger = useDebounceWithDelay(
    taskUpdateTrigger,
    keyDown,
    reQueryAfterMillis,
  );
  const visibleDailyNotes = useVisibleDailyNotes(
    layoutReady,
    debouncedTaskUpdateTrigger,
  );
  const listsFromVisibleDailyNotes = useListsFromVisibleDailyNotes(
    visibleDailyNotes,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
  );
  const tasksFromExtraSources = useTasksFromExtraSources({
    dataviewSource,
    debouncedTaskUpdateTrigger,
    visibleDailyNotes,
    dataviewFacade,
  });
  const dataviewTasks = useDataviewTasks({
    listsFromVisibleDailyNotes,
    tasksFromExtraSources,
    settingsStore,
  });
  const visibleDataviewTasks = useVisibleDataviewTasks(dataviewTasks);

  const visibleTasks = derived(
    [visibleDataviewTasks, visibleDayToEventOccurences],
    ([$visibleDataviewTasks, $visibleDayToEventOccurences]) =>
      mergeTasks($visibleDataviewTasks, $visibleDayToEventOccurences),
  );

  const tasksForToday = derived(
    [visibleTasks, currentTime],
    ([$visibleTasks, $currentTime]) => {
      return $visibleTasks[getDayKey($currentTime)];
    },
  );

  const editContext = useEditContext({
    obsidianFacade,
    onUpdate: planEditor.syncTasksWithFile,
    settings: settingsStore,
    visibleTasks,
  });

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
    icalSyncTrigger,
    isOnline,
  };
}
