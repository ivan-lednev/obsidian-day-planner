import { Moment } from "moment";
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
