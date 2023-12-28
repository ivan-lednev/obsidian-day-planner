import { isString } from "lodash/fp";
import { Moment } from "moment";
import { STask } from "obsidian-dataview";

import { clockFormat, clockKey, clockSeparator } from "../constants";
import { toClockRecordOrRecords } from "../service/dataview-facade";

import {
  getDiffInMinutes,
  getMinutesSinceMidnight,
  splitByDay,
} from "./moment";
import { createProp, updateProp } from "./properties";

interface Time {
  startMinutes: number;
  durationMinutes: number;
}

export type ClockMoments = [Moment, Moment];

// TODO: simplify
export function toMoments(clockPropValue: string): [Moment, Moment] {
  if (!isString(clockPropValue)) {
    return null;
  }

  const [rawStart, rawEnd] = clockPropValue.split(clockSeparator);

  if (!rawStart || !rawEnd) {
    return null;
  }

  const [start, end] = [rawStart, rawEnd].map((value) => window.moment(value));

  if (!start.isValid() || !end.isValid()) {
    return null;
  }

  return [start, end];
}

export function toTime([start, end]: ClockMoments): Time {
  return {
    startMinutes: getMinutesSinceMidnight(start),
    durationMinutes: getDiffInMinutes(end, start),
  };
}

export function hasActiveClockProp(sTask: STask) {
  if (!sTask.clocked) {
    return false;
  }

  if (Array.isArray(sTask.clocked)) {
    return sTask.clocked.some(isActiveClockProp);
  }

  return isActiveClockProp(sTask.clocked);
}

function isActiveClockProp(clockPropValue: unknown) {
  return !String(clockPropValue).includes(clockSeparator);
}

export function createClockTimestamp() {
  return window.moment().format(clockFormat);
}

export function createActiveClock() {
  return createProp(clockKey, createClockTimestamp());
}

export function clockOut(line: string) {
  return updateProp(
    line,
    (previous) => `${previous}${clockSeparator}${createClockTimestamp()}`,
  );
}

export function containsActiveClock(line: string) {
  return line.includes(clockKey) && !line.includes(clockSeparator);
}

export function withActiveClock(sTask: STask): STask {
  return {
    ...sTask,
    text: `${sTask.text}
${createActiveClock()}`,
  };
}

export function withoutActiveClock(sTask: STask) {
  return {
    ...sTask,
    text: sTask.text
      .split("\n")
      .filter((line) => !containsActiveClock(line))
      .join("\n"),
  };
}

export function withActiveClockCompleted(sTask: STask) {
  return {
    ...sTask,
    text: sTask.text
      .split("\n")
      .map((line) => (containsActiveClock(line) ? clockOut(line) : line))
      .join("\n"),
  };
}

export function toClockRecords(sTasks: STask[]) {
  return sTasks
    .filter((task) => task.clocked)
    .flatMap((sTask) => toClockRecordOrRecords(sTask, sTask.clocked))
    .filter(Boolean);
}

// todo: use simpler lifting pattern
// todo: improve name
export function arrToClockMoments(clockPropValueOrValues: string | string[]) {
  if (Array.isArray(clockPropValueOrValues)) {
    return clockPropValueOrValues.flatMap(toClockMoments);
  }

  // todo: this may return an array
  return toClockMoments(clockPropValueOrValues);
}

export function toClockMoments(clockPropValue: string) {
  const clockMoments = toMoments(clockPropValue);

  if (!clockMoments) {
    return null;
  }

  return splitByDay(...clockMoments);
}
