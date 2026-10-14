import type { Activity, Props, LogEntry } from "./activity-schema";
import {
  closeActivityRecord,
  createActivityRecordWithAttributes,
  getOpenActivityLog,
  hasOpenActivityClock,
  mergeActivityDetails,
} from "./activity-workflow";

export function isWithOpenClock(props?: Props) {
  return Boolean(
    props?.activities?.some((activity) => hasOpenActivityClock(activity)),
  );
}

function getActivitiesCopy(props: Props): Activity[] {
  return (props.activities ?? []).map((activity) => ({
    ...activity,
    log: [...(activity.log ?? [])],
  }));
}

export function startActivityLog(
  props: Props,
  activityName: string,
  attributes?: Record<string, unknown>,
  startedAt: number | string = Date.now(),
): Props {
  const activities = getActivitiesCopy(props);

  const updatedActivity = createActivityRecordWithAttributes(
    activityName,
    attributes,
    startedAt,
  );

  return {
    ...props,
    activities: activities.concat(updatedActivity),
  };
}

export function appendNoteToActivity(
  props: Props,
  activityIndex: number,
  note: string,
): Props {
  const activities = getActivitiesCopy(props);

  if (activityIndex < 0 || activityIndex >= activities.length) {
    throw new Error("There is no activity");
  }

  const activity = activities[activityIndex];
  const trimmedNote = note.trim();

  if (!trimmedNote) {
    return props;
  }

  const updatedActivities = activities.with(
    activityIndex,
    mergeActivityDetails(activity, { notes: trimmedNote }),
  );

  return {
    ...props,
    activities: updatedActivities,
  };
}

export function updateActivityLogEntry(
  props: Props,
  activityIndex: number,
  logEntryIndex: number,
  updates: Partial<LogEntry>,
): Props {
  const activities = getActivitiesCopy(props);

  if (activityIndex < 0 || activityIndex >= activities.length) {
    throw new Error("There is no activity");
  }

  const activity = activities[activityIndex];
  const log = activity.log;

  if (!log) {
    throw new Error("There is no log");
  }

  if (logEntryIndex < 0 || logEntryIndex >= log.length) {
    throw new Error("There is no log entry");
  }

  const updatedActivities = activities.with(activityIndex, {
    ...activity,
    log: log.with(logEntryIndex, {
      ...log[logEntryIndex],
      ...updates,
    }),
  });

  getOpenActivityLog(updatedActivities[activityIndex]);

  return {
    ...props,
    activities: updatedActivities,
  };
}

export function updateActivityDetails(
  props: Props,
  activityIndex: number,
  updates: Record<string, unknown>,
): Props {
  const activities = getActivitiesCopy(props);

  if (activityIndex < 0 || activityIndex >= activities.length) {
    throw new Error("There is no activity");
  }

  return {
    ...props,
    activities: activities.with(
      activityIndex,
      mergeActivityDetails(activities[activityIndex], updates),
    ),
  };
}

export function cancelOpenClockByActivityIndex(
  props: Props,
  activityWithOpenClockIndex: number,
): Props {
  const activities = getActivitiesCopy(props);

  if (activityWithOpenClockIndex === -1) {
    throw new Error("There is no open clock");
  }

  const activityWithOpenClock = activities[activityWithOpenClockIndex];
  const log = activityWithOpenClock.log;

  if (!log) {
    throw new Error("There is no log");
  }

  const openLog = getOpenActivityLog(activityWithOpenClock);
  const openClockIndex = openLog ? log.indexOf(openLog) : -1;

  if (openClockIndex === -1) {
    throw new Error("There is no open clock");
  }

  const updatedActivity: Activity = {
    ...activityWithOpenClock,
    log: log.toSpliced(openClockIndex, 1),
  };

  const updatedActivities = !updatedActivity.log?.some(
    (entry) => entry.start && entry.end,
  )
    ? activities.toSpliced(activityWithOpenClockIndex, 1)
    : activities.with(activityWithOpenClockIndex, updatedActivity);

  return {
    ...props,
    activities: updatedActivities,
  };
}

export function cancelActivityLogEntry(
  props: Props,
  activityIndex: number,
  logEntryIndex: number,
): Props {
  const activities = getActivitiesCopy(props);
  const activity = activities[activityIndex];
  if (activity) getOpenActivityLog(activity);
  const entry = activity?.log?.[logEntryIndex];
  if (!entry || entry.end) throw new Error("There is no open clock");
  const log = activity.log!.toSpliced(logEntryIndex, 1);
  return {
    ...props,
    activities: log.length
      ? activities.with(activityIndex, { ...activity, log })
      : activities.toSpliced(activityIndex, 1),
  };
}

export function clockOut(
  props: Props,
  activityIndex: number,
  attributes?: Record<string, unknown>,
  endedAt: number | string = Date.now(),
): Props {
  const activities = getActivitiesCopy(props);

  if (activityIndex < 0 || activityIndex >= activities.length) {
    throw new Error("There is no open clock");
  }

  const updatedActivity = closeActivityRecord(
    activities[activityIndex],
    attributes,
    endedAt,
  );

  const updatedActivities = activities.with(activityIndex, updatedActivity);

  return {
    ...props,
    activities: updatedActivities,
  };
}
