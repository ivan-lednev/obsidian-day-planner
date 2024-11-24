import { flow, groupBy, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { App } from "obsidian";
import {
  derived,
  fromStore,
  readable,
  writable,
  type Readable,
  type Writable,
} from "svelte/store";

import { icalRefreshIntervalMillis, reQueryAfterMillis } from "../constants";
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
import { withClockMoments } from "./dataview";
import { getUpdateTrigger } from "./store";
import { getDayKey, getRenderKey, isWithTime } from "./task-utils";
import { useRemoteTasks } from "./use-remote-tasks";

interface CreateHooksProps {
  app: App;
  dataviewFacade: DataviewFacade;
  workspaceFacade: WorkspaceFacade;
  settingsStore: Writable<DayPlannerSettings>;
  onUpdate: OnUpdateFn;
  currentTime: Readable<Moment>;
}

function getDarkModeFlag() {
  return document.body.hasClass("theme-dark");
}

export type PointerDateTime = Writable<{
  dateTime?: Moment | undefined;
  type?: "dateTime" | "date" | undefined;
}>;

export function useTasks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  combinedIcalSyncTrigger: Readable<object>;
  debouncedTaskUpdateTrigger: Readable<object>;
  isOnline: Readable<boolean>;
  visibleDays: Readable<Moment[]>;
  layoutReady: Readable<boolean>;
  dataviewFacade: DataviewFacade;
  // todo: replace with metadata cache
  app: App;
  dataviewSource: Readable<string>;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  pointerDateTime: PointerDateTime;
}) {
  const {
    settingsStore,
    combinedIcalSyncTrigger,
    isOnline,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    app,
    dataviewSource,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    onUpdate,
  } = props;

  const remoteTasks = useRemoteTasks({
    settings: settingsStore,
    refreshSignal: combinedIcalSyncTrigger,
    isOnline,
    visibleDays,
  });

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
    refreshSignal: debouncedTaskUpdateTrigger,
    dataviewSource,
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
        // We keep time resolution to the minute, so that all the elements move
        //  in sync on the UI when time changes
        durationMinutes: m.getDiffInMinutes(
          $currentTime,
          task.startTime.clone().startOf("minute"),
        ),
        truncated: "bottom" as const,
      })),
  );

  const visibleTasksWithClockProps = derived(
    [tasksFromExtraSources, tasksWithActiveClockPropsAndDurations],
    ([$tasksFromExtraSources, $tasksWithActiveClockPropsAndDurations]) => {
      const flatTasksWithClocks = $tasksFromExtraSources
        .filter(hasClockProp)
        .flatMap(withClockMoments)
        .map(dv.toTaskWithClock)
        .concat($tasksWithActiveClockPropsAndDurations);

      return groupBy(
        ({ startTime }) => getDayKey(startTime),
        flatTasksWithClocks,
      );
    },
  );

  // todo: remove duplication
  function getDisplayedTasksWithClocksForTimeline(day: Moment) {
    return derived(
      visibleTasksWithClockProps,
      ($visibleTasksWithClockProps) => {
        const tasksForDay = $visibleTasksWithClockProps[getDayKey(day)] || [];

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
    dataviewTasks: tasksFromExtraSources,
    dataviewSource,
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
    getDisplayedTasksWithClocksForTimeline,
    tasksForToday,
    search,
    editContext,
    newlyStartedTasks,
  };
}

export function createHooks({
  app,
  dataviewFacade,
  workspaceFacade,
  settingsStore,
  onUpdate,
  currentTime,
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

  const {
    tasksWithActiveClockProps,
    getDisplayedTasksWithClocksForTimeline,
    tasksForToday,
    search,
    editContext,
    newlyStartedTasks,
  } = useTasks({
    settingsStore,
    combinedIcalSyncTrigger,
    isOnline,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    // todo: remove this dep
    app,
    dataviewSource,
    currentTime,
    workspaceFacade,
    onUpdate,
    pointerDateTime,
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
