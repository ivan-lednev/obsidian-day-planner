import { flow, groupBy, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import type { MetadataCache } from "obsidian";
import { derived, type Readable, type Writable } from "svelte/store";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { type PathToListProps } from "../../redux/dataview/dataview-slice";
import { DataviewFacade } from "../../service/dataview-facade";
import type { PeriodicNotes } from "../../service/periodic-notes";
import { WorkspaceFacade } from "../../service/workspace-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask, RemoteTask, Task, WithTime } from "../../task-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../../types";
import { isValidLogEntry, type LogEntry } from "../../util/clock";
import * as dv from "../../util/dataview";
import * as m from "../../util/moment";
import { splitMultiday } from "../../util/moment";
import { getUpdateTrigger } from "../../util/store";
import { getDayKey, getRenderKey } from "../../util/task-utils";

import { useDataviewTasks } from "./use-dataview-tasks";
import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTasks } from "./use-newly-started-tasks";
import { useVisibleDailyNotes } from "./use-visible-daily-notes";
import { useVisibleDataviewTasks } from "./use-visible-dataview-tasks";
import type { STask } from "obsidian-dataview";

export function useTasks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  debouncedTaskUpdateTrigger: Readable<object>;
  isOnline: Readable<boolean>;
  visibleDays: Readable<Moment[]>;
  layoutReady: Readable<boolean>;
  dataviewFacade: DataviewFacade;
  metadataCache: MetadataCache;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  dataviewChange: Readable<unknown>;
  remoteTasks: Readable<RemoteTask[]>;
  listProps: Readable<PathToListProps>;
  periodicNotes: PeriodicNotes;
}) {
  const {
    settingsStore,
    visibleDays,
    layoutReady,
    debouncedTaskUpdateTrigger,
    dataviewFacade,
    periodicNotes,
    metadataCache,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    dataviewChange,
    onUpdate,
    onEditAborted,
    remoteTasks,
    listProps,
  } = props;

  const visibleDailyNotes = useVisibleDailyNotes(
    layoutReady,
    debouncedTaskUpdateTrigger,
    visibleDays,
    periodicNotes,
  );

  const dataviewTasks = useDataviewTasks({
    dataviewFacade,
    metadataCache,
    settings: settingsStore,
    visibleDailyNotes,
    refreshSignal: debouncedTaskUpdateTrigger,
  });

  const dataviewTasksWithProps = derived(
    [dataviewTasks, listProps],
    ([$dataviewTasks, $listProps]) =>
      $dataviewTasks.map((it) => ({
        ...it,
        props: $listProps[it.path]?.[it.line],
      })),
  );

  const tasksWithValidLogEntries = derived(
    [dataviewTasksWithProps],
    ([$dataviewTasksWithProps]) =>
      $dataviewTasksWithProps.filter((it) => {
        const log = it.props?.planner?.log;

        return (
          Array.isArray(log) &&
          log.length > 0 &&
          log.every<LogEntry>(isValidLogEntry)
        );
      }),
  );

  // todo: remove duplication
  const tasksWithActiveClockProps = derived(
    [tasksWithValidLogEntries, currentTime],
    ([$tasksWithValidLogEntries, $currentTime]) =>
      $tasksWithValidLogEntries
        .flatMap((sTask) => {
          return sTask.props.planner.log
            .filter(({ end }) => typeof end === "undefined")
            .flatMap(({ start }) => {
              const parsedStart = window.moment(
                start,
                window.moment.ISO_8601,
                true,
              );

              return splitMultiday(parsedStart, $currentTime);
            })
            .map((clockMoments) => ({
              sTask,
              clockMoments,
            }));
        })
        .map(({ sTask, clockMoments }) => ({
          ...dv.toTaskWithClock({ sTask, clockMoments }),
          truncated: ["bottom" as const],
        })),
  );

  const logRecords = derived(
    [tasksWithValidLogEntries],
    ([$tasksWithValidLogEntries]) =>
      $tasksWithValidLogEntries
        .flatMap((sTask) => {
          return sTask.props.planner.log
            .filter(({ end }) => typeof end !== "undefined")
            .flatMap(({ start, end }) => {
              const parsedStart = window.moment(
                start,
                window.moment.ISO_8601,
                true,
              );
              const parsedEnd = window.moment(
                end,
                window.moment.ISO_8601,
                true,
              );

              return splitMultiday(parsedStart, parsedEnd);
            })
            .map((clockMoments) => ({
              sTask,
              clockMoments,
            }));
        })
        .map(dv.toTaskWithClock),
  );

  const combinedClocks = derived(
    [tasksWithActiveClockProps, logRecords],
    ([$tasksWithActiveClockProps, $logRecords]) =>
      $tasksWithActiveClockProps.concat($logRecords),
  );

  const dayToLogRecords = derived(combinedClocks, ($combinedClocks) =>
    groupBy(({ startTime }) => getDayKey(startTime), $combinedClocks),
  );

  function getDisplayedTasksWithClocksForTimeline(day: Moment) {
    return derived(dayToLogRecords, ($dayToLogRecords) => {
      const tasksForDay = $dayToLogRecords[getDayKey(day)] || [];

      return flow(uniqBy(getRenderKey), addHorizontalPlacing)(tasksForDay);
    });
  }

  const localTasks = useVisibleDataviewTasks(
    dataviewTasks,
    visibleDays,
    periodicNotes,
  );

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

  const abortEditTrigger = derived(
    [localTasks, dataviewChange],
    getUpdateTrigger,
  );

  const editContext = useEditContext({
    periodicNotes,
    workspaceFacade,
    onUpdate,
    onEditAborted,
    settings: settingsStore,
    localTasks,
    remoteTasks,
    pointerDateTime,
    abortEditTrigger,
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
