import { isEmpty } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";

import { defaultDurationMinutes } from "../constants";
import { settings } from "../global-store/settings";
import {
  checkboxRegExp,
  keylessScheduledPropRegExp,
  listTokenRegExp,
  scheduledPropRegExp,
  shortScheduledPropRegExp,
  timestampRegExp,
} from "../regexp";
import { Task } from "../types";

import { getListTokens } from "./dataview";
import { getId } from "./id";
import { addMinutes, minutesToMoment, minutesToMomentOfDay } from "./moment";

export function isEqualTask(a: Task, b: Task) {
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

export function getRenderKey(task: Task) {
  return `${task.startMinutes} ${getEndMinutes(task)} ${task.text} ${
    task.isGhost ?? ""
  }`;
}

export function getNotificationKey(task: Task) {
  return `${task.location?.path ?? "blank"}::${task.startMinutes}::${
    task.durationMinutes
  }::${task.text}`;
}

export function copy(task: Task): Task {
  return {
    ...task,
    id: getId(),
    isGhost: true,
    location: { ...task.location },
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

// todo: confusing. Do not mix up parsed and updated props
// todo: add replaceTimestamp()
function taskLineToString(task: Task) {
  const firstLineText = removeTimestamp(
    removeListTokens(getFirstLine(task.text)),
  );

  return `${getListTokens(task)} ${createTimestamp(
    task.startMinutes,
    task.durationMinutes,
    get(settings).timestampFormat,
  )} ${firstLineText}
${getLinesAfterFirst(task.text)}`;
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

export function updateTaskText(task: Task) {
  return { ...task, text: taskLineToString(task) };
}

export function updateTaskScheduledDay(task: Task, dayKey: string) {
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

export function createTask(day: Moment, startMinutes: number): Task {
  return {
    id: getId(),
    startMinutes,
    durationMinutes: defaultDurationMinutes,
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    symbol: "-",
    status: " ",
    placing: {
      widthPercent: 100,
      xOffsetPercent: 0,
    },
  };
}

export function getFirstLine(text: string) {
  return text.split("\n")[0];
}

export function getLinesAfterFirst(text: string) {
  return text.split("\n").slice(1).join("\n");
}

export function removeTimestamp(text: string) {
  const match = timestampRegExp.exec(text.trim());

  if (!match) {
    return text;
  }

  const {
    groups: { text: textWithoutTimestamp },
  } = match;

  return textWithoutTimestamp;
}

export function removeListTokens(text: string) {
  return text.replace(listTokenRegExp, "").replace(checkboxRegExp, "");
}
