import { flow, groupBy, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { App } from "obsidian";
import {
  derived,
  fromStore,
  readable,
  writable,
  type Writable,
} from "svelte/store";

import { icalRefreshIntervalMillis, reQueryAfterMillis } from "../constants";
import { currentTime } from "../global-store/current-time";
import { addHorizontalPlacing } from "../overlap/overlap";
import { DataviewFacade } from "../service/dataview-facade";
import { WorkspaceFacade } from "../service/workspace-facade";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask, Task, WithTime } from "../task-types";
import type { OnUpdateFn } from "../types";
import { useDataviewChange } from "../ui/hooks/use-dataview-change";
import { useDataviewLoaded } from "../ui/hooks/use-dataview-loaded";
import { useDataviewTasks } from "../ui/hooks/use-dataview-tasks";
import { useDateRanges } from "../ui/hooks/use-date-ranges";
import { withClockMoments } from "../ui/hooks/use-day-to-stasks-with-clock-moments";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useEditContext } from "../ui/hooks/use-edit/use-edit-context";
import { useIsOnline } from "../ui/hooks/use-is-online";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useListsFromVisibleDailyNotes } from "../ui/hooks/use-lists-from-visible-daily-notes";
import { useModPressed } from "../ui/hooks/use-mod-pressed";
import { useNewlyStartedTasks } from "../ui/hooks/use-newly-started-tasks";
import { useSearch } from "../ui/hooks/use-search.svelte";
import { useTasksFromExtraSources } from "../ui/hooks/use-tasks-from-extra-sources";
import { useTasksWithActiveClockProps } from "../ui/hooks/use-tasks-with-active-clock-props";
import { useVisibleDailyNotes } from "../ui/hooks/use-visible-daily-notes";
import { useVisibleDataviewTasks } from "../ui/hooks/use-visible-dataview-tasks";
import { useVisibleDays } from "../ui/hooks/use-visible-days";
import * as m from "../util/moment";

import { hasClockProp } from "./clock";
import * as dv from "./dataview";
import { getUpdateTrigger } from "./store";
import {
  getDayKey,
  getEmptyTasksForDay,
  getRenderKey,
  isWithTime,
} from "./task-utils";
import { useRemoteTasks } from "./use-remote-tasks";

interface CreateHooksProps {
  app: App;
  dataviewFacade: DataviewFacade;
  workspaceFacade: WorkspaceFacade;
  settingsStore: Writable<DayPlannerSettings>;
  onUpdate: OnUpdateFn;
}

function getDarkModeFlag() {
  return document.body.hasClass("theme-dark");
}

export function createHooks({
  app,
  dataviewFacade,
  workspaceFacade,
  settingsStore,
  onUpdate,
}: CreateHooksProps) {
  const dataviewSource = derived(settingsStore, ($settings) => {
    return $settings.dataviewSource;
  });
  const layoutReady = readable(false, (set) => {
    app.workspace.onLayoutReady(() => set(true));
  });
  const pointerDateTime = writable<{
    dateTime?: Moment;
    type?: "dateTime" | "date";
  }>({});

  const isDarkModeStore = readable(getDarkModeFlag(), (set) => {
    const eventRef = app.workspace.on("css-change", () => {
      set(getDarkModeFlag());
    });

    return () => {
      app.workspace.offref(eventRef);
    };
  });
  const isDarkMode = fromStore(isDarkModeStore);

  const keyDown = useKeyDown();
  const isModPressed = useModPressed();
  const isOnline = useIsOnline();

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

  const dateRanges = useDateRanges();
  const visibleDays = useVisibleDays(dateRanges.ranges);

  const remoteTasks = useRemoteTasks({
    settings: settingsStore,
    syncTrigger: combinedIcalSyncTrigger,
    isOnline,
    visibleDays,
  });

  const dataviewSyncTrigger = writable();
  const taskUpdateTrigger = derived(
    [dataviewChange, dataviewSource, dataviewSyncTrigger],
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
    visibleDays,
  );

  const listsFromVisibleDailyNotes = useListsFromVisibleDailyNotes({
    visibleDailyNotes,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    metadataCache: app.metadataCache,
    settings: settingsStore,
  });
  const tasksFromExtraSources = useTasksFromExtraSources({
    dataviewSource,
    debouncedTaskUpdateTrigger,
    visibleDailyNotes,
    dataviewFacade,
  });

  const tasksWithActiveClockProps = useTasksWithActiveClockProps({
    dataviewTasks: tasksFromExtraSources,
  });

  const tasksWithActiveClockPropsAndDurations = derived(
    [tasksWithActiveClockProps, currentTime],
    ([$tasksWithActiveClockProps, $currentTime]) =>
      $tasksWithActiveClockProps.map((task: LocalTask) => ({
        ...task,
        durationMinutes: m.getDiffInMinutes($currentTime, task.startTime),
        truncated: "bottom",
      })),
  );

  const visibleTasksWithClockProps = derived(
    [tasksFromExtraSources, tasksWithActiveClockPropsAndDurations],
    ([$tasksFromExtraSources, $tasksWithActiveClockPropsAndDurations]) => {
      const flatTasksWithClocks = $tasksFromExtraSources
        .filter(hasClockProp)
        .map(withClockMoments)
        // todo: simplify
        .flat()
        .map(dv.toTaskWithClock)
        .concat($tasksWithActiveClockPropsAndDurations);

      return groupBy(
        ({ startTime }) => getDayKey(startTime),
        flatTasksWithClocks,
      );
    },
  );

  function getDisplayedTasksWithClocksForTimeline(day: Moment) {
    return derived(
      visibleTasksWithClockProps,
      ($visibleTasksWithClockProps) => {
        const tasksForDay =
          $visibleTasksWithClockProps[getDayKey(day)] || getEmptyTasksForDay();

        return flow(uniqBy(getRenderKey), addHorizontalPlacing)(tasksForDay);
      },
    );
  }

  const dataviewTasks = useDataviewTasks({
    listsFromVisibleDailyNotes,
    tasksFromExtraSources,
    settingsStore,
  });
  const localTasks = useVisibleDataviewTasks(dataviewTasks, visibleDays);

  const tasksForToday = derived(
    [localTasks, remoteTasks, currentTime],
    ([$localTasks, $remoteTasks, $currentTime]) => {
      return [...$localTasks, ...$remoteTasks].filter(
        (task): task is WithTime<Task> =>
          task.startTime.isSame($currentTime, "day") && isWithTime(task),
      );
    },
  );

  const search = useSearch({
    dataviewFacade,
    dataviewSource,
    taskUpdateTrigger,
    keyDown,
  });

  const editContext = useEditContext({
    workspaceFacade,
    onUpdate,
    settings: settingsStore,
    localTasks,
    remoteTasks,
    // todo: doesn't have to know about pointers
    pointerDateTime,
  });

  const newlyStartedTasks = useNewlyStartedTasks({
    settings: settingsStore,
    tasksForToday,
    currentTime,
  });

  return {
    tasksWithActiveClockProps,
    editContext,
    tasksForToday,
    dataviewLoaded,
    newlyStartedTasks,
    isModPressed,
    icalSyncTrigger,
    dataviewSyncTrigger,
    isOnline,
    isDarkMode,
    search,
    dateRanges,
    pointerDateTime,
    getDisplayedTasksWithClocksForTimeline,
  };
}
