import type { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import { timeRangeRegExp } from "../regexp";
import { getDiffInMinutes } from "../util/moment";

import { parseTime } from "./time";

export function replaceOrPrependTimeRange(line: string, timeRange: string) {
  if (timeRangeRegExp.test(line)) {
    return line.replace(timeRangeRegExp, timeRange);
  }

  return `${timeRange} ${line}`;
}

export function getTimeFromLine({ line, day }: { line: string; day: Moment }) {
  const match = line.match(timeRangeRegExp);

  if (!match?.groups) {
    return null;
  }

  const {
    groups: { start, end },
  } = match;

  isNotVoid(
    start,
    "Expected to find 'start' group on a timestamp regexp match",
  );

  const startTime = parseTime(start, day);

  let durationMinutes: number | undefined;

  if (end) {
    const endTime = parseTime(end, day);

    // todo: handle edge, use default duration
    if (endTime.isAfter(startTime)) {
      durationMinutes = getDiffInMinutes(endTime, startTime);
    } else {
      durationMinutes = getDiffInMinutes(
        startTime,
        endTime.clone().add(1, "day"),
      );
    }
  }

  return {
    startTime,
    durationMinutes,
  };
}

export function compareTimestamps(a: string, b: string) {
  const now = window.moment();

  const aTime = getTimeFromLine({ line: a, day: now });
  const bTime = getTimeFromLine({ line: b, day: now });

  if (!aTime && !bTime) {
    return 0;
  }

  if (!aTime) {
    return 1;
  }

  if (!bTime) {
    return -1;
  }

  return aTime.startTime.diff(bTime.startTime);
}
