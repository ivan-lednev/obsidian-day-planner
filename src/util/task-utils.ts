import { isEmpty } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";

import { defaultDurationMinutes } from "../constants";
import { settings } from "../global-store/settings";
import {
  keylessScheduledPropRegExp,
  scheduledPropRegExp,
  shortScheduledPropRegExp,
} from "../regexp";
import type { Task } from "../types";
import { PlacedTask } from "../types";

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

export function getRenderKey(task: PlacedTask) {
  return `${task.startMinutes} ${getEndMinutes(task)} ${task.text} ${
    task.isGhost ?? ""
  }`;
}

export function copy(task: Task): Task {
  return {
    ...task,
    id: getId(),
    isGhost: true,
    // TODO: there should be a better way to track which tasks are new
    location: { ...task.location, line: undefined },
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

// TODO: broken?
function taskLineToString(task: Task) {
  return `${task.listTokens}${createTimestamp(
    task.startMinutes,
    task.durationMinutes,
    get(settings).timestampFormat,
  )} ${task.firstLineText}`;
}

export function updateScheduledPropInText(text: string, dayKey: string) {
  const updated = text
    .replace(shortScheduledPropRegExp, `$1${dayKey}`)
    .replace(scheduledPropRegExp, `$1${dayKey}$2`)
    .replace(keylessScheduledPropRegExp, `$1${dayKey}$2`);

  if (updated !== text) {
    return updated;
  }

  return `${text} ⌛ ${dayKey}`;
}

export function updateTaskText(task: Task) {
  return { ...task, firstLineText: taskLineToString(task) };
}

export function updateTaskScheduledDay(task: Task, dayKey: string) {
  return {
    ...task,
    firstLineText: updateScheduledPropInText(task.firstLineText, dayKey),
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

export function createTask(day: Moment, startMinutes: number): PlacedTask {
  return {
    id: getId(),
    startMinutes,
    durationMinutes: defaultDurationMinutes,
    firstLineText: "New item",
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    listTokens: "- [ ] ",
    placing: {
      widthPercent: 100,
      xOffsetPercent: 0,
    },
  };
}
