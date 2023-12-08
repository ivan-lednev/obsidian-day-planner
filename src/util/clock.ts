import { Moment } from "moment";
import { STask } from "obsidian-dataview";

import { clockSeparator } from "../constants";

import { getDiffInMinutes, getMinutesSinceMidnight } from "./moment";

interface Time {
  startMinutes: number;
  durationMinutes: number;
}

interface Clock {
  start: Moment;
  end: Moment;
}

export function parseClock(rawClock: string) {
  if (typeof rawClock !== "string") {
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

export function hasActiveClock(task: STask) {
  if (!task.clocked) {
    return false;
  }

  if (Array.isArray(task.clocked)) {
    return task.clocked.some(
      (clock) => !String(clock).contains(clockSeparator),
    );
  }

  return !String(task.clocked).contains(clockSeparator);
}
