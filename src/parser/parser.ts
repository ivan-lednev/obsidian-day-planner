import type { Moment } from "moment";
import { dedent } from "ts-dedent";

import {
  strictTimestampAnywhereInLineRegExp,
  looseTimestampAtStartOfLineRegExp,
} from "../regexp";
import type { LocalTask } from "../task-types";
import { getDiffInMinutes } from "../util/moment";
import {
  getFirstLine,
  getLinesAfterFirst,
  removeListTokens,
} from "../util/task-utils";

import { parseTimestamp } from "./timestamp";

function execTimestampPatterns(line: string) {
  const trimmed = line.trim();

  return (
    looseTimestampAtStartOfLineRegExp.exec(trimmed) ||
    strictTimestampAnywhereInLineRegExp.exec(trimmed)
  );
}

export function testTimestampPatterns(line: string) {
  const trimmed = line.trim();

  return (
    looseTimestampAtStartOfLineRegExp.test(trimmed) ||
    strictTimestampAnywhereInLineRegExp.test(trimmed)
  );
}

export function replaceOrPrependTimestamp(line: string, timestamp: string) {
  if (looseTimestampAtStartOfLineRegExp.test(line)) {
    return line.replace(looseTimestampAtStartOfLineRegExp, timestamp);
  }

  if (strictTimestampAnywhereInLineRegExp.test(line)) {
    return line.replace(strictTimestampAnywhereInLineRegExp, timestamp);
  }

  return `${timestamp} ${line}`;
}

export function getTimeFromLine({ line, day }: { line: string; day: Moment }) {
  const match = execTimestampPatterns(line);

  if (!match?.groups) {
    return null;
  }

  const {
    groups: { start, end },
  } = match;

  const startTime = parseTimestamp(start, day);

  let durationMinutes: number | undefined;

  if (end) {
    const endTime = parseTimestamp(end, day);

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

export function getDisplayedText(task: LocalTask) {
  if (task.status) {
    return task.text;
  }

  return `${removeListTokens(getFirstLine(task.text))}
${dedent(getLinesAfterFirst(task.text)).trimStart()}`;
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
