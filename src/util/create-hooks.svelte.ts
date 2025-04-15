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

import type DayPlanner from "../main";
import { addHorizontalPlacing } from "../overlap/overlap";
import { dataviewChange as dataviewChangeAction } from "../redux/dataview/dataview-slice";
import {
  darkModeUpdated,
  layoutReady as layoutReadyAction,
  keyDown as keyDownAction,
  networkStatusChanged,
} from "../redux/global-slice";
import { selectRemoteTasks } from "../redux/ical/ical-slice";
import type { AppDispatch } from "../redux/store";
import { createUseSelector } from "../redux/use-selector";
import { DataviewFacade } from "../service/dataview-facade";
import { WorkspaceFacade } from "../service/workspace-facade";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask, Task, WithTime } from "../task-types";
import type { OnUpdateFn, PointerDateTime } from "../types";
import { useDataviewChange } from "../ui/hooks/use-dataview-change";
import { useDataviewLoaded } from "../ui/hooks/use-dataview-loaded";
import { useDataviewTasks } from "../ui/hooks/use-dataview-tasks";
import { useDateRanges } from "../ui/hooks/use-date-ranges";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useEditContext } from "../ui/hooks/use-edit/use-edit-context";
import { useIsOnline } from "../ui/hooks/use-is-online";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useModPressed } from "../ui/hooks/use-mod-pressed";
import { useNewlyStartedTasks } from "../ui/hooks/use-newly-started-tasks";
import { useTasksWithActiveClockProps } from "../ui/hooks/use-tasks-with-active-clock-props";
import { useVisibleDailyNotes } from "../ui/hooks/use-visible-daily-notes";
import { useVisibleDataviewTasks } from "../ui/hooks/use-visible-dataview-tasks";
import { useVisibleDays } from "../ui/hooks/use-visible-days";
import * as m from "../util/moment";

import { hasClockProp } from "./clock";
import * as dv from "./dataview";
import { withClockMoments } from "./dataview";
import { getUpdateTrigger } from "./store";
import { getDayKey, getRenderKey } from "./task-utils";
import { reQueryAfterMillis } from "../constants";

interface CreateHooksProps {
  app: App;
  dataviewFacade: DataviewFacade;
  workspaceFacade: WorkspaceFacade;
  settingsStore: Writable<DayPlannerSettings>;
  onUpdate: OnUpdateFn;
  currentTime: Readable<Moment>;
  dispatch: AppDispatch;
  plugin: DayPlanner;
  useSelector: ReturnType<typeof createUseSelector>;
}

function getDarkModeFlag() {
  return document.body.hasClass("theme-dark");
}

export function useTasks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  debouncedTaskUpdateTrigger: Readable<object>;
  isOnline: Readable<boolean>;
  visibleDays: Readable<Moment[]>;
  layoutReady: Readable<boolean>;
  dataviewFacade: DataviewFacade;
  // todo: replace with metadata cache
  app: App;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  pointerDateTime: Readable<PointerDateTime>;
  useSelector: ReturnType<typeof createUseSelector>;
}) {
  const {
    settingsStore,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    app,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    onUpdate,
    useSelector,
  } = props;

  const remoteTasks = useSelector(selectRemoteTasks);

  const visibleDailyNotes = useVisibleDailyNotes(
    layoutReady,
    debouncedTaskUpdateTrigger,
    visibleDays,
  );

  const dataviewTasks = useDataviewTasks({
    dataviewFacade,
    metadataCache: app.metadataCache,
    settings: settingsStore,
    visibleDailyNotes,
    refreshSignal: debouncedTaskUpdateTrigger,
  });

  const tasksWithActiveClockProps = useTasksWithActiveClockProps({
    dataviewTasks,
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
        truncated: ["bottom" as const],
      })),
  );

  const visibleTasksWithClockProps = derived(
    [dataviewTasks, tasksWithActiveClockPropsAndDurations],
    ([$dataviewTasks, $tasksWithActiveClockPropsAndDurations]) => {
      const flatTasksWithClocks = $dataviewTasks
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

  const localTasks = useVisibleDataviewTasks(dataviewTasks, visibleDays);

  const tasksWithTimeForToday = derived(
    [localTasks, remoteTasks, currentTime],
    ([$localTasks, $remoteTasks, $currentTime]: [Task[], Task[], Moment]) => {
      return $localTasks
        .concat($remoteTasks)
        .filter(
          (task): task is WithTime<Task> =>
            task.startTime.isSame($currentTime, "day") && !task.isAllDayEvent,
        );
    },
  );

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
    tasksWithTimeForToday,
    currentTime,
  });

  return {
    tasksWithActiveClockProps,
    getDisplayedTasksWithClocksForTimeline,
    tasksWithTimeForToday,
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
  dispatch,
  plugin,
  useSelector,
}: CreateHooksProps) {
  const dataviewSource = derived(settingsStore, ($settings) => {
    return $settings.dataviewSource;
  });

  const layoutReady = readable(false, (set) => {
    app.workspace.onLayoutReady(() => set(true));
  });
  app.workspace.onLayoutReady(() => {
    dispatch(layoutReadyAction());
  });

  const pointerDateTime = writable<PointerDateTime>({
    dateTime: window.moment(),
    type: "dateTime",
  });

  const isDarkModeStore = readable(getDarkModeFlag(), (set) => {
    const eventRef = app.workspace.on("css-change", () => {
      set(getDarkModeFlag());
    });

    return () => {
      app.workspace.offref(eventRef);
    };
  });
  const isDarkMode = fromStore(isDarkModeStore);
  plugin.registerEvent(
    app.workspace.on("css-change", () => {
      dispatch(darkModeUpdated(getDarkModeFlag()));
    }),
  );

  const keyDown = useKeyDown();
  plugin.registerDomEvent(document, "keydown", () => {
    dispatch(keyDownAction());
  });

  const isModPressed = useModPressed();
  // todo:

  const isOnline = useIsOnline();
  plugin.registerDomEvent(window, "online", () => {
    dispatch(networkStatusChanged({ isOnline: true }));
  });
  plugin.registerDomEvent(window, "offline", () => {
    dispatch(networkStatusChanged({ isOnline: false }));
  });

  const dataviewChange = useDataviewChange(app.metadataCache);
  plugin.registerEvent(
    app.metadataCache.on(
      // @ts-expect-error
      "dataview:metadata-change",
      () => dispatch(dataviewChangeAction()),
    ),
  );

  const dataviewLoaded = useDataviewLoaded(app);

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
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
  } = useTasks({
    settingsStore,
    isOnline,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    // todo: remove this dep
    app,
    currentTime,
    workspaceFacade,
    onUpdate,
    pointerDateTime,
    useSelector,
  });

  return {
    tasksWithActiveClockProps,
    editContext,
    tasksWithTimeForToday,
    dataviewLoaded,
    newlyStartedTasks,
    isModPressed,
    dataviewSyncTrigger,
    isOnline,
    isDarkMode,
    dateRanges,
    pointerDateTime,
    getDisplayedTasksWithClocksForTimeline,
    visibleDays,
    dataviewChange,
  };
}
