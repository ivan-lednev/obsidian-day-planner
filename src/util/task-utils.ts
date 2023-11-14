import { difference, differenceBy, isEmpty } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";

import { defaultDurationMinutes } from "../constants";
import { settings } from "../global-store/settings";
import {
  keylessScheduledPropRegExp,
  scheduledPropRegExp,
  shortScheduledPropRegExp,
} from "../regexp";
import type { Diff, Task, Tasks } from "../types";
import { PlacedTask } from "../types";
import { getDayKey } from "../ui/hooks/use-edit/transform/drag-and-shift-others";

import { getId } from "./id";
import { addMinutes, minutesToMoment, minutesToMomentOfDay } from "./moment";
import { getTasksWithTime } from "./tasks-utils";

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
    // todo: there should be a better way to track which tasks are new
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

export function getTasksWithUpdatedDay(tasks: Tasks) {
  return Object.entries(tasks)
    .flatMap(([dayKey, tasks]) =>
      tasks.withTime.map((task) => ({ dayKey, task })),
    )
    .filter(
      ({ dayKey, task }) =>
        !task.isGhost && dayKey !== getDayKey(task.startTime),
    );
}

export function areValuesEmpty(record: Record<string, [] | object>) {
  return Object.values(record).every(isEmpty);
}

function getPristine(flatBaseline: PlacedTask[], flatNext: PlacedTask[]) {
  return flatNext.filter((task) =>
    flatBaseline.find((baselineTask) => isEqualTask(task, baselineTask)),
  );
}

function getCreatedTasks(flatBaseline: PlacedTask[], flatNext: PlacedTask[]) {
  return differenceBy((task) => task.id, flatNext, flatBaseline);
}

function getTasksWithUpdatedTime(
  flatBaseline: PlacedTask[],
  flatNext: PlacedTask[],
) {
  const pristine = getPristine(flatBaseline, flatNext);

  return difference(flatNext, pristine).filter((task) => !task.isGhost);
}

export function getDiff(baseline: Tasks, next: Tasks) {
  const flatBaseline = getTasksWithTime(baseline);
  const flatNext = getTasksWithTime(next);

  return {
    updatedTime: getTasksWithUpdatedTime(flatBaseline, flatNext),
    updatedDay: getTasksWithUpdatedDay(next),
    created: getCreatedTasks(flatBaseline, flatNext),
  };
}

// todo: broken?
function taskLineToString(task: Task) {
  return `${task.listTokens}${createTimestamp(
    task.startMinutes,
    task.durationMinutes,
    get(settings).timestampFormat,
  )} ${task.firstLineText}`;
}

function updateScheduledPropInText(text: string, dayKey: string) {
  const updated = text
    .replace(shortScheduledPropRegExp, `$1${dayKey}`)
    .replace(scheduledPropRegExp, `$1${dayKey}$2`)
    .replace(keylessScheduledPropRegExp, `$1${dayKey}$2`);

  if (updated !== text) {
    return updated;
  }

  return `${text} ⌛ ${dayKey}`;
}

function updateTaskText(task: Task) {
  return { ...task, firstLineText: taskLineToString(task) };
}

function updateTaskScheduledDay(task: Task, dayKey: string) {
  return {
    ...task,
    firstLineText: updateScheduledPropInText(task.firstLineText, dayKey),
  };
}

export function updateText(diff: Diff) {
  return {
    created: diff.created.map(updateTaskText),
    updated: [
      ...diff.updatedTime.map(updateTaskText),
      ...diff.updatedDay.map(({ dayKey, task }) =>
        updateTaskText(updateTaskScheduledDay(task, dayKey)),
      ),
    ],
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
