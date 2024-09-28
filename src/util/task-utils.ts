import { flow, isEmpty } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";

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
  type WithTime,
} from "../task-types";

import { getListTokens } from "./dataview";
import { getId } from "./id";
import { addMinutes, minutesToMoment, minutesToMomentOfDay } from "./moment";

export function isEqualTask(a: WithTime<LocalTask>, b: WithTime<LocalTask>) {
  return (
    a.id === b.id &&
    a.startMinutes === b.startMinutes &&
    a.durationMinutes === b.durationMinutes
  );
}

export function getEndMinutes(task: {
  startMinutes: number;
  durationMinutes: number;
}) {
  return task.startMinutes + task.durationMinutes;
}

export function getEndTime(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return task.startTime.clone().add(task.durationMinutes, "minutes");
}

function isScheduled<T extends object>(task: T): task is WithTime<T> {
  return Object.hasOwn(task, "startMinutes");
}

export function getRenderKey(task: WithTime<Task> | Task) {
  const key: string[] = [];

  if (isScheduled(task)) {
    key.push(String(task.startMinutes), String(getEndMinutes(task)));
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
    return `${task.calendar.name}::${task.startMinutes}:${task.durationMinutes}::${task.summary}`;
  }

  return `${task.location?.path ?? "blank"}::${task.startMinutes}::${
    task.durationMinutes
  }::${task.text}`;
}

export function copy(task: WithTime<LocalTask>): WithTime<LocalTask> {
  return {
    ...task,
    id: getId(),
    isGhost: true,
    location: task.location && { ...task.location },
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

export function areValuesEmpty(record: Record<string, [] | object>) {
  return Object.values(record).every(isEmpty);
}

function taskLineToString(task: WithTime<LocalTask>) {
  const firstLine = removeListTokens(getFirstLine(task.text));

  const updatedTimestamp = createTimestamp(
    task.startMinutes,
    task.durationMinutes,
    get(settings).timestampFormat,
  );
  const listTokens = getListTokens(task);
  const updatedFirstLineText = replaceOrPrependTimestamp(
    firstLine,
    updatedTimestamp,
  );

  const otherLines = getLinesAfterFirst(task.text);

  return `${listTokens} ${updatedFirstLineText}
${otherLines}`;
}

export function updateScheduledPropInText(text: string, dayKey: string) {
  const updated = text
    .replace(shortScheduledPropRegExp, `$1${dayKey}`)
    .replace(scheduledPropRegExp, `$1${dayKey}$2`)
    .replace(keylessScheduledPropRegExp, `$1${dayKey}$2`);

  if (updated !== text) {
    return updated;
  }

  return `${text} ⏳ ${dayKey}`;
}

export function updateTaskText(task: WithTime<LocalTask>) {
  return { ...task, text: taskLineToString(task) };
}

export function updateTaskScheduledDay(
  task: WithTime<LocalTask>,
  dayKey: string,
) {
  return {
    ...task,
    text: `${updateScheduledPropInText(getFirstLine(task.text), dayKey)}
${getLinesAfterFirst(task.text)}`,
  };
}

export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function createTask(
  day: Moment,
  startMinutes: number,
  settings: DayPlannerSettings,
): WithTime<LocalTask> {
  return {
    id: getId(),
    startMinutes,
    durationMinutes: settings.defaultDurationMinutes,
    text: "New item",
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
