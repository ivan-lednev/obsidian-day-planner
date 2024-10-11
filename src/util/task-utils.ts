import { produce } from "immer";
import { flow } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { settings } from "../global-store/settings";
import { replaceOrPrependTimestamp } from "../parser/parser";
import {
  checkboxRegExp,
  keylessScheduledPropRegExp,
  listTokenWithSpacesRegExp,
  looseTimestampAtStartOfLineRegExp,
  scheduledPropRegExp,
  shortScheduledPropRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  isRemote,
  type LocalTask,
  type Task,
  type TaskLocation,
  type WithTime,
} from "../task-types";

import { getListTokens } from "./dataview";
import { getId } from "./id";
import {
  addMinutes,
  getMinutesSinceMidnight,
  minutesToMoment,
  minutesToMomentOfDay,
} from "./moment";
import { getDayKey, hasDateFromProp } from "./tasks-utils";

export function getEndMinutes(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return getMinutesSinceMidnight(task.startTime) + task.durationMinutes;
}

export function getEndTime(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return task.startTime.clone().add(task.durationMinutes, "minutes");
}

function isScheduled<T extends object>(task: T): task is WithTime<T> {
  return (
    Object.hasOwn(task, "startTime") ||
    ("isAllDayEvent" in task && task.isAllDayEvent === false)
  );
}

export function getRenderKey(task: WithTime<Task> | Task) {
  const key: string[] = [];

  if (isScheduled(task)) {
    key.push(
      String(getMinutesSinceMidnight(task.startTime)),
      String(getEndMinutes(task)),
    );
  }

  if (isRemote(task)) {
    key.push(task.calendar.name, task.summary);
  } else {
    key.push(task.text, String(task.isGhost ? "ghost" : ""));
  }

  return key.join("::");
}

export function getNotificationKey(task: WithTime<Task>) {
  if (isRemote(task)) {
    return `${task.calendar.name}::${getMinutesSinceMidnight(task.startTime)}:${task.durationMinutes}::${task.summary}`;
  }

  return `${task.location?.path ?? "blank"}::${getMinutesSinceMidnight(task.startTime)}::${
    task.durationMinutes
  }::${task.text}`;
}

/**
 * Tasks with date prop are copied under the original task, tasks from daily
 * notes get sent under a heading based on the new date.
 *
 * @param original
 */
export function copy(original: WithTime<LocalTask>): WithTime<LocalTask> {
  let location: TaskLocation | undefined;

  if (hasDateFromProp(original)) {
    const originalLocation = original.location;

    isNotVoid(
      originalLocation,
      `Did not find location on task$ ${getOneLineSummary(original)}`,
    );

    location = produce(originalLocation, (draft) => {
      draft.position.start.line = draft.position.end.line + 1;
    });
  }

  return {
    ...original,
    id: getId(),
    isGhost: true,
    location,
  };
}

export function createTimestamp(
  startMinutes: number,
  durationMinutes: number,
  format: string,
) {
  const start = minutesToMoment(startMinutes);
  const end = addMinutes(start, durationMinutes);

  return `${start.format(format)} - ${end.format(format)}`;
}

export function taskToString(task: WithTime<LocalTask>) {
  const firstLine = removeListTokens(getFirstLine(task.text));

  const updatedTimestamp = createTimestamp(
    getMinutesSinceMidnight(task.startTime),
    task.durationMinutes,
    get(settings).timestampFormat,
  );
  const listTokens = getListTokens(task);
  const withUpdatedTimestamp = replaceOrPrependTimestamp(
    firstLine,
    updatedTimestamp,
  );
  const updatedFirstLineText = updateScheduledPropInText(
    withUpdatedTimestamp,
    getDayKey(task.startTime),
  );

  const otherLines = getLinesAfterFirst(task.text);

  return `${listTokens} ${updatedFirstLineText}
${otherLines}`;
}

export function updateScheduledPropInText(text: string, dayKey: string) {
  return text
    .replace(shortScheduledPropRegExp, `$1${dayKey}`)
    .replace(scheduledPropRegExp, `$1${dayKey}$2`)
    .replace(keylessScheduledPropRegExp, `$1${dayKey}$2`);
}

export function updateTaskText(task: WithTime<LocalTask>) {
  return { ...task, text: taskToString(task) };
}

export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function createTask(props: {
  day: Moment;
  startMinutes: number;
  settings: DayPlannerSettings;
  text?: string;
  location?: TaskLocation;
}): WithTime<LocalTask> {
  const { day, startMinutes, settings, location, text = "New item" } = props;

  return {
    location,
    id: getId(),
    durationMinutes: settings.defaultDurationMinutes,
    text,
    startTime: minutesToMomentOfDay(startMinutes, day),
    symbol: "-",
    status:
      settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function getFirstLine(text: string) {
  return text.split("\n")[0];
}

export function getOneLineSummary(task: Task) {
  if (isRemote(task)) {
    return task.summary;
  }

  return flow(
    removeListTokens,
    removeTimestampFromStart,
  )(getFirstLine(task.text));
}

export function getLinesAfterFirst(text: string) {
  return text.split("\n").slice(1).join("\n");
}

export function removeListTokens(text: string) {
  return text
    .replace(listTokenWithSpacesRegExp, "")
    .replace(checkboxRegExp, "");
}

export function removeTimestampFromStart(text: string) {
  return text.replace(looseTimestampAtStartOfLineRegExp, "");
}
