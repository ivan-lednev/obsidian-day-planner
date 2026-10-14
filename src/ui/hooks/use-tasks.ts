import { flow, groupBy, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import type { MetadataCache } from "obsidian";
import { derived, type Readable, type Writable } from "svelte/store";

import { defaultDurationMinutes } from "../../constants";
import { addHorizontalPlacing } from "../../overlap/overlap";
import { type PathToListProps } from "../../redux/dataview/dataview-slice";
import { DataviewFacade } from "../../service/dataview-facade";
import type { PeriodicNotes } from "../../service/periodic-notes";
import { WorkspaceFacade } from "../../service/workspace-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask, RemoteTask, Task, WithTime } from "../../task-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../../types";
import { getActivityDisplayLabel } from "../../util/activity-definitions";
import { getActivityLogEntries } from "../../util/activity-log-location";
import { getOpenActivityLog } from "../../util/activity-open-clock";
import { getActivityResourcePath } from "../../util/activity-resources";
import { createClockTaskFromActivity } from "../../util/clock";
import { doesOverlapWithRange, splitMultiday } from "../../util/moment";
import { getUpdateTrigger } from "../../util/store";
import { getDayKey, getRenderKey } from "../../util/task-utils";

import { useDataviewTasks } from "./use-dataview-tasks";
import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTasks } from "./use-newly-started-tasks";
import { useVisibleDailyNotes } from "./use-visible-daily-notes";
import { useVisibleDataviewTasks } from "./use-visible-dataview-tasks";

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

  const activitiesWithLogs = derived([listProps], ([$listProps]) =>
    Object.entries($listProps).flatMap(([path, lineToProps]) =>
      Object.values(lineToProps).flatMap(({ parsed, position }) =>
        (parsed.activities ?? []).map((activity, activityIndex) => ({
          activity: {
            ...activity,
            title: getActivityDisplayLabel(activity.activity, activity),
            resourcePath: getActivityResourcePath({
              metadataCache,
              activityName: activity.activity,
              activityEntry: activity,
              sourcePath: path,
            }),
            location: { path, position },
          },
          path,
          activityIndex,
        })),
      ),
    ),
  );

  const activityEntries = derived(activitiesWithLogs, ($rows) =>
    $rows.flatMap(({ activity, path, activityIndex }) =>
      getActivityLogEntries(path, [activity]).map(
        ({ log, activityLocation }) => ({
          activity,
          log,
          activityLocation: { ...activityLocation, activityIndex },
        }),
      ),
    ),
  );

  const logSummary = derived(activitiesWithLogs, ($rows) =>
    $rows.map(({ activity }) => ({
      title: activity.title,
      log: (activity.log ?? []).map(({ start, end }) => ({
        start,
        end: end || "-",
      })),
      timeSpent: (activity.log ?? []).reduce(
        (result, log) =>
          result.add(window.moment(log.end).diff(window.moment(log.start))),
        window.moment.duration(),
      ),
    })),
  );

  const localTasks = useVisibleDataviewTasks(
    dataviewTasks,
    visibleDays,
    periodicNotes,
  );

  const tasksWithActiveClockProps = derived(
    [activityEntries, currentTime],
    ([$entries, $currentTime]) =>
      $entries
        .filter(({ activity, log }) => getOpenActivityLog(activity) === log)
        .map(({ activity, log, activityLocation }) => ({
          activity,
          log,
          activityLocation,
          clockMoments: [
            window.moment(log.start, window.moment.ISO_8601, true),
            $currentTime.clone(),
          ] as [Moment, Moment],
        }))
        .filter(({ clockMoments: [start] }) => start.isValid())
        .map(({ activity, log, activityLocation, clockMoments }) => ({
          ...createClockTaskFromActivity({
            activity,
            clockMoments,
            defaultDurationMinutes,
          }),
          activityLocation,
          clockActivity: { ...activity, log: [log] },
        })),
  );

  const splitTasksWithActiveClockProps = derived(
    [tasksWithActiveClockProps],
    ([$tasksWithActiveClockProps]) =>
      $tasksWithActiveClockProps.flatMap((task) => {
        const endTime = task.startTime
          .clone()
          .add(task.durationMinutes, "minutes");

        return splitMultiday(task.startTime, endTime).map(
          ([startTime, endTime]) => ({
            ...task,
            startTime,
            durationMinutes: endTime.diff(startTime, "minutes"),
            truncated: ["bottom" as const],
          }),
        );
      }),
  );

  const logRecords = derived([activityEntries], ([$entries]) =>
    $entries
      .filter(({ log }) => typeof log.end !== "undefined")
      .flatMap(({ activity, log, activityLocation }) =>
        splitMultiday(
          window.moment(log.start, window.moment.ISO_8601, true),
          window.moment(log.end, window.moment.ISO_8601, true),
        ).map((clockMoments) => ({
          ...createClockTaskFromActivity({
            activity,
            clockMoments,
            defaultDurationMinutes,
          }),
          activityLocation,
          clockActivity: { ...activity, log: [log] },
        })),
      ),
  );

  const combinedClocks = derived(
    [splitTasksWithActiveClockProps, logRecords],
    ([$splitTasksWithActiveClockProps, $logRecords]: [
      LocalTask[],
      LocalTask[],
    ]) => $splitTasksWithActiveClockProps.concat($logRecords),
  );

  const activityHistoryForStatusBar = derived(
    [combinedClocks, currentTime],
    ([$combinedClocks, $currentTime]) => {
      const rangeStart = $currentTime.clone().subtract(24, "hours");
      const rangeEnd = $currentTime.clone();

      return $combinedClocks.filter((clock) =>
        doesOverlapWithRange(
          {
            start: clock.startTime,
            end: clock.startTime.clone().add(clock.durationMinutes, "minutes"),
          },
          {
            start: rangeStart,
            end: rangeEnd,
          },
        ),
      );
    },
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
    dataviewTasks,
    tasksWithActiveClockProps,
    activityHistoryForStatusBar,
    getDisplayedTasksWithClocksForTimeline,
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
    logSummary,
  };
}
