import type { Moment } from "moment";
import type { CachedMetadata } from "obsidian";
import { dedent } from "ts-dedent";

import { timestampRegExp } from "../regexp";
import type { UnscheduledTask } from "../types";
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

export function getTimeFromSTask({ line, day }: { line: string; day: Moment }) {
  const match = timestampRegExp.exec(line.trim());

  if (!match?.groups) {
    return null;
  }

  const {
    groups: { start, end },
  } = match;
  const startTime = parseTimestamp(start, day);
  const endTime = parseTimestamp(end, day);

  const durationMinutes = endTime?.isAfter(startTime)
    ? getDiffInMinutes(endTime, startTime)
    : undefined;

  return {
    startTime,
    durationMinutes,
  };
}

export function getDisplayedText(task: UnscheduledTask) {
  if (task.status) {
    return task.text;
  }

  return `${removeListTokens(getFirstLine(task.text))}
${dedent(getLinesAfterFirst(task.text)).trimStart()}`;
}
