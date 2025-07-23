import type { Moment } from "moment";
import { MetadataCache, Workspace } from "obsidian";
import { derived, type Readable, writable, type Writable } from "svelte/store";

import { reQueryAfterMillis } from "../constants";
import type { PathToListProps } from "../redux/dataview/dataview-slice";
import { DataviewFacade } from "../service/dataview-facade";
import { WorkspaceFacade } from "../service/workspace-facade";
import type { DayPlannerSettings } from "../settings";
import type { RemoteTask } from "../task-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../types";
import { useDateRanges } from "../ui/hooks/use-date-ranges";
import { useDebounceWithDelay } from "../ui/hooks/use-debounce-with-delay";
import { useTasks } from "../ui/hooks/use-tasks";
import { useVisibleDays } from "../ui/hooks/use-visible-days";
import { getUpdateTrigger } from "./store";

export function createHooks(props: {
  dataviewFacade: DataviewFacade;
  workspaceFacade: WorkspaceFacade;
  metadataCache: MetadataCache;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  settingsStore: Writable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  dataviewChange: Readable<unknown>;
  remoteTasks: Readable<RemoteTask[]>;
  listProps: Readable<PathToListProps>;
  keyDown: Readable<unknown>;
  isOnline: Readable<boolean>;
  layoutReady: Readable<boolean>;
}) {
  const {
    dataviewFacade,
    workspaceFacade,
    settingsStore,
    onUpdate,
    onEditAborted,
    currentTime,
    dataviewChange,
    metadataCache,
    remoteTasks,
    listProps,
    keyDown,
    isOnline,
    layoutReady,
  } = props;

  const dataviewSource = derived(settingsStore, ($settings) => {
    return $settings.dataviewSource;
  });

  const pointerDateTime = writable<PointerDateTime>({
    dateTime: window.moment(),
    type: "dateTime",
  });

  const dateRanges = useDateRanges();
  const visibleDays = useVisibleDays(dateRanges.ranges);

  const taskUpdateTrigger = derived(
    [dataviewChange, dataviewSource],
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
    metadataCache,
    currentTime,
    workspaceFacade,
    onUpdate,
    onEditAborted,
    pointerDateTime,
    remoteTasks,
    listProps,
  });

  return {
    tasksWithActiveClockProps,
    editContext,
    tasksWithTimeForToday,
    newlyStartedTasks,
    dateRanges,
    pointerDateTime,
    getDisplayedTasksWithClocksForTimeline,
    visibleDays,
  };
}
