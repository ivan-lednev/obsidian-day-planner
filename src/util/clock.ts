import { isString } from "lodash/fp";
import { Moment } from "moment";
import { STask } from "obsidian-dataview";

import { clockFormat, clockKey, clockSeparator } from "../constants";

import { getDiffInMinutes, getMinutesSinceMidnight } from "./moment";
import { createProp, updateProp } from "./properties";

interface Time {
  startMinutes: number;
  durationMinutes: number;
}

interface Clock {
  start: Moment;
  end: Moment;
}

export function parseClock(rawClock: string) {
  if (!isString(rawClock)) {
    return null;
  }

  const [rawStart, rawEnd] = rawClock.split(clockSeparator);

  if (!rawStart || !rawEnd) {
    return null;
  }

  const [start, end] = [rawStart, rawEnd].map((value) => window.moment(value));

  if (!start.isValid() || !end.isValid()) {
    return null;
  }

  return { start, end };
}

export function clockToTime({ start, end }: Clock): Time {
  return {
    startMinutes: getMinutesSinceMidnight(start),
    durationMinutes: getDiffInMinutes(end, start),
  };
}

export function hasActiveClock(sTask: STask) {
  if (!sTask.clocked) {
    return false;
  }

  if (Array.isArray(sTask.clocked)) {
    return sTask.clocked.some((prop) => !String(prop).includes(clockSeparator));
  }

  return !String(sTask.clocked).includes(clockSeparator);
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

export function withActiveClock(sTask: STask) {
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
