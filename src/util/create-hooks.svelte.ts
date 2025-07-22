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

import { reQueryAfterMillis } from "../constants";
import {
  layoutReady as layoutReadyAction,
} from "../redux/global-slice";
import type { AppDispatch } from "../redux/store";
import { createUseSelector } from "../redux/use-selector";
import { DataviewFacade } from "../service/dataview-facade";
import { WorkspaceFacade } from "../service/workspace-facade";
import type { DayPlannerSettings } from "../settings";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../types";
import { useDataviewLoaded } from "../ui/hooks/use-dataview-loaded";
import { useDateRanges } from "../ui/hooks/use-date-ranges";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useIsOnline } from "../ui/hooks/use-is-online";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useModPressed } from "../ui/hooks/use-mod-pressed";
import { useTasks } from "../ui/hooks/use-tasks";
import { useVisibleDays } from "../ui/hooks/use-visible-days";

import { getDarkModeFlag } from "./dom";
import { getUpdateTrigger } from "./store";

interface CreateHooksProps {
  app: App;
  dataviewFacade: DataviewFacade;
  workspaceFacade: WorkspaceFacade;
  settingsStore: Writable<DayPlannerSettings>;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  currentTime: Readable<Moment>;
  dispatch: AppDispatch;
  useSelector: ReturnType<typeof createUseSelector>;
  dataviewChange: Readable<unknown>;
}

export function createHooks({
  app,
  dataviewFacade,
  workspaceFacade,
  settingsStore,
  onUpdate,
  onEditAborted,
  currentTime,
  dispatch,
  useSelector,
  dataviewChange,
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
  const keyDown = useKeyDown();
  const isModPressed = useModPressed();

  const isOnline = useIsOnline();

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
    dataviewChange,
    settingsStore,
    isOnline,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    metadataCache: app.metadataCache,
    currentTime,
    workspaceFacade,
    onUpdate,
    onEditAborted,
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
  };
}
