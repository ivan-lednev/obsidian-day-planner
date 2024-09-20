import type { Moment } from "moment";
import type { CachedMetadata } from "obsidian";
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

import { parseTimestamp } from "./timestamp/timestamp";

export function getListItemsUnderHeading(
  metadata: CachedMetadata,
  heading: string,
) {
  const { headings } = metadata;

  if (!headings) {
    return [];
  }

  const planHeadingIndex = headings.findIndex((h) => h.heading === heading);

  if (planHeadingIndex < 0) {
    return [];
  }

  const planHeading = headings[planHeadingIndex];
  const nextHeadingOfSameLevel = headings
    .slice(planHeadingIndex + 1)
    .find((heading) => heading.level <= planHeading.level);

  return metadata.listItems?.filter((li) => {
    const isBelowPlan =
      li.position.start.line > planHeading.position.start.line;
    const isAboveNextHeadingIfItExists =
      !nextHeadingOfSameLevel ||
      li.position.start.line < nextHeadingOfSameLevel.position.start.line;

    return isBelowPlan && isAboveNextHeadingIfItExists;
  });
}

export function getHeadingByText(metadata: CachedMetadata, text: string) {
  const { headings = [] } = metadata;

  return headings?.find((h) => h.heading === text);
}

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
  const withStartOfLineReplacement = line.replace(
    looseTimestampAtStartOfLineRegExp,
    timestamp,
  );

  if (line !== withStartOfLineReplacement) {
    return withStartOfLineReplacement;
  }

  const withStrictReplacement = line.replace(
    strictTimestampAnywhereInLineRegExp,
    timestamp,
  );

  if (line !== withStrictReplacement) {
    return withStrictReplacement;
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

  let durationMinutes;

  if (end) {
    const endTime = parseTimestamp(end, day);

    if (endTime?.isAfter(startTime)) {
      durationMinutes = getDiffInMinutes(endTime, startTime);
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
