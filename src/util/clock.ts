import { filter, map } from "lodash/fp";
import type { Moment } from "moment";
import { STask } from "obsidian-dataview";

import { clockFormat, clockKey, clockSeparator } from "../constants";

import { getDiffInMinutes, getMinutesSinceMidnight } from "./moment";
import { createProp, updateProp } from "./properties";

interface Time {
  startMinutes: number;
  durationMinutes: number;
}

export type ClockMoments = [Moment, Moment];

export function toClockMoments(clockPropValue: string) {
  return clockPropValue
    .split(clockSeparator)
    .map((value) => window.moment(value));
}

export function areValidClockMoments(clockMoments: Moment[]) {
  return (
    clockMoments.length === 2 &&
    clockMoments.every((clockMoment) => clockMoment.isValid())
  );
}

export function toTime([start, end]: ClockMoments): Time {
  return {
    startMinutes: getMinutesSinceMidnight(start),
    durationMinutes: getDiffInMinutes(end, start),
  };
}

export function hasClockProp(sTask: STask) {
  return Object.hasOwn(sTask, clockKey);
}

export function hasActiveClockProp(sTask: STask) {
  if (!hasClockProp(sTask)) {
    return false;
  }

  if (Array.isArray(sTask[clockKey])) {
    return sTask[clockKey].some(isActiveClockPropValue);
  }

  return isActiveClockPropValue(sTask[clockKey]);
}

export function isActiveClockPropValue(clockPropValue: unknown) {
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
    text: `${sTask.text.trimEnd()}
${createActiveClock()}`,
  };
}

export function withoutActiveClock(sTask: STask) {
  return {
    ...sTask,
    text: lines(
      filter((line) => !containsActiveClock(line)),
      sTask.text,
    ),
  };
}

export function lines(fn: (lines: string[]) => string[], text: string) {
  return fn(text.split("\n")).join("\n");
}

export function withActiveClockCompleted(task: { text: string }) {
  return {
    ...task,
    text: lines(
      map((line) => (containsActiveClock(line) ? clockOut(line) : line)),
      task.text,
    ),
  };
}

export function assertActiveClock(sTask: STask) {
  if (!hasActiveClockProp(sTask)) {
    throw new Error("The task has no active clocks");
  }

  return sTask;
}

export function assertNoActiveClock(sTask: STask) {
  if (hasActiveClockProp(sTask)) {
    throw new Error("The task already has an active clock");
  }

  return sTask;
}
