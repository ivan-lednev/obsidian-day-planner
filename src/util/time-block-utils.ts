import { produce } from "immer";
import { flow } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { bullet, defaultDayFormat, emDash } from "../constants";
import { settings } from "../global-store/settings";
import { replaceOrPrependTimeRange } from "../parser/parser";
import {
  obsidianBlockIdRegExp,
  scheduledPropRegExps,
  timeRangeAtStartOfLineRegExp,
  timeRangeRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  type BaseTimeBlock,
  isRemote,
  type LocalTimeBlock,
  type RemoteTimeBlock,
  type TimeBlock,
  type TimeBlockLocation,
  type WithDuration,
} from "../time-block-types";

import { getId } from "./id";
import {
  type Node,
  createMarkdownListTokens,
  getFirstLine,
  getFirstLineAsMarkdown,
  getIndentationForListParagraph,
  indentLines,
  removeListTokens,
} from "./markdown";
import * as m from "./moment";
import {
  addMinutes,
  getMinutesSinceMidnight,
  minutesToMoment,
  minutesToMomentOfDay,
} from "./moment";
import { deleteProps, updateScheduledPropInText } from "./props";

export function getEndMinutes(timeBlock: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return (
    getMinutesSinceMidnight(timeBlock.startTime) + timeBlock.durationMinutes
  );
}

export function getEndTime(timeBlock: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return timeBlock.startTime.clone().add(timeBlock.durationMinutes, "minutes");
}

// todo: remove this inconsistency
export function isWithTime<T extends TimeBlock>(
  timeBlock: T,
): timeBlock is WithDuration<T> {
  return Object.hasOwn(timeBlock, "startTime") || !timeBlock.isAllDayEvent;
}

const keySeparator = ":";

function getRemoteTimeBlockIdentity(timeBlock: RemoteTimeBlock) {
  const key: string[] = [];

  key.push(
    timeBlock.calendar.name,
    timeBlock.startTime.toISOString(false),
    timeBlock.summary,
  );

  return key.join(keySeparator);
}

// todo: should remove?
export function getRenderKey(timeBlock: WithDuration<TimeBlock> | TimeBlock) {
  if (isRemote(timeBlock)) {
    return getRemoteTimeBlockIdentity(timeBlock);
  }

  const key: string[] = [];

  if (isWithTime(timeBlock)) {
    key.push(
      String(getMinutesSinceMidnight(timeBlock.startTime)),
      String(getEndMinutes(timeBlock)),
    );
  }

  if (timeBlock.location) {
    const {
      path,
      position: {
        start: { line },
      },
    } = timeBlock.location;

    key.push(path, String(line));
  }

  key.push(timeBlock.text);

  return key.join(keySeparator);
}

export function getNotificationKey(timeBlock: WithDuration<TimeBlock>) {
  if (isRemote(timeBlock)) {
    return getRemoteTimeBlockIdentity(timeBlock);
  }

  const key: string[] = [];

  key.push(
    timeBlock.location?.path ?? "blank",
    String(getMinutesSinceMidnight(timeBlock.startTime)),
    String(timeBlock.durationMinutes),
    timeBlock.text,
  );

  return key.join(keySeparator);
}

/**
 * Time blocks with date prop are copied under the original time block, time blocks from daily
 * notes get sent under a heading based on the new date.
 */
export function copy(
  original: WithDuration<LocalTimeBlock>,
): WithDuration<LocalTimeBlock> {
  let location: TimeBlockLocation | undefined;

  if (hasDateFromProp(original)) {
    const originalLocation = original.location;

    isNotVoid(
      originalLocation,
      `Did not find location on time block$ ${getOneLineSummary(original)}`,
    );

    location = produce(originalLocation, (draft) => {
      draft.position.start.line = draft.position.end.line + 1;
    });
  }

  return {
    ...original,
    location,
    id: getId(),
  };
}

export function createTimestamp(
  startMinutes: number,
  durationMinutes: number,
  format: string,
  separator = " - ",
) {
  const start = minutesToMoment(startMinutes);
  const end = addMinutes(start, durationMinutes);

  return `${start.format(format)}${separator}${end.format(format)}`;
}

export function getEmptyTimeBlocksForDay() {
  return { withTime: [], noTime: [] };
}

export function getDayKey(day: Moment) {
  return day.format(defaultDayFormat);
}

export function toString(timeBlock: WithDuration<LocalTimeBlock>) {
  const updatedTimestamp = createTimestamp(
    getMinutesSinceMidnight(timeBlock.startTime),
    timeBlock.durationMinutes,
    get(settings).timestampFormat,
  );
  const listTokens = createMarkdownListTokens(timeBlock);

  const withUpdatedOrDeletedTimeRange = timeBlock.isAllDayEvent
    ? removeTimeRange(getFirstLine(timeBlock.text))
    : replaceOrPrependTimeRange(getFirstLine(timeBlock.text), updatedTimestamp);

  const updatedFirstLineText = updateScheduledPropInText(
    withUpdatedOrDeletedTimeRange,
    getDayKey(timeBlock.startTime),
  );

  const paragraphs = timeBlock.text
    .split("\n")
    .slice(1)
    .map((line) => getIndentationForListParagraph() + line)
    .join("\n");

  let result = `${listTokens} ${updatedFirstLineText}`;

  if (paragraphs) {
    result += "\n";
    result += paragraphs;
  }

  if (timeBlock.children && timeBlock.children.length > 0) {
    result += "\n";
    result += timeBlock.children
      .map((child) => getIndentedText(child, "\t"))
      .join("\n");
  }

  return result;
}

export function appendText(taskText: string, toAppend: string) {
  const blockIdMatch = taskText.match(obsidianBlockIdRegExp);

  if (blockIdMatch) {
    const blockId = blockIdMatch[0];

    return taskText.slice(0, blockIdMatch.index) + toAppend + blockId;
  }

  return taskText + toAppend;
}

export function create(props: {
  day: Moment;
  startMinutes: number;
  settings: DayPlannerSettings;
  text?: string;
  location?: TimeBlockLocation;
  status?: string;
  isAllDayEvent?: boolean;
}): WithDuration<LocalTimeBlock> {
  const {
    day,
    startMinutes,
    settings,
    location,
    text = "New item",
    status,
    isAllDayEvent = false,
  } = props;

  return {
    location,
    id: getId(),
    durationMinutes: settings.defaultDurationMinutes,
    text,
    startTime: minutesToMomentOfDay(startMinutes, day),
    isAllDayEvent,
    symbol: "-",
    status:
      status || settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function getOneLineSummary(timeBlock: TimeBlock) {
  if (isRemote(timeBlock)) {
    return timeBlock.summary;
  }

  return removeTimeRangeFromStartOfLine(timeBlock.text);
}

export function truncateToRange(
  timeBlock: WithDuration<TimeBlock>,
  range: m.Range,
) {
  const start = timeBlock.startTime.clone().startOf("day");
  const end = getEndTime(timeBlock).clone().endOf("day");

  const startOfRange = range.start.clone().startOf("day");
  const endOfRange = range.end.clone().add(1, "day").startOf("day");

  const truncatedBase = { ...timeBlock };

  if (start.isBefore(startOfRange)) {
    truncatedBase.durationMinutes = getEndTime(timeBlock).diff(
      startOfRange,
      "minutes",
    );

    truncatedBase.startTime = startOfRange;
    truncatedBase.truncated = [...(truncatedBase.truncated ?? []), "left"];
  }

  if (end.isAfter(endOfRange)) {
    truncatedBase.durationMinutes = m.getDiffInMinutes(
      truncatedBase.startTime,
      endOfRange,
    );

    truncatedBase.truncated = [...(truncatedBase.truncated ?? []), "right"];
  }

  return truncatedBase;
}

export function removeTimeRangeFromStartOfLine(text: string) {
  return text.replace(timeRangeAtStartOfLineRegExp, "");
}

export function removeTimeRange(text: string) {
  return text.replace(timeRangeRegExp, "").trim().replace(/\s+/g, " ");
}

export function isTimeEqual(a: LocalTimeBlock, b: LocalTimeBlock) {
  return (
    a.startTime.isSame(b.startTime) &&
    a.durationMinutes === b.durationMinutes &&
    a.isAllDayEvent === b.isAllDayEvent
  );
}

export function hasDateFromProp(timeBlock: LocalTimeBlock) {
  return scheduledPropRegExps.some((regexp) => regexp.test(timeBlock.text));
}

export function clamp<T extends WithDuration<BaseTimeBlock>>(
  timeBlock: T,
  start: Moment,
  end: Moment,
): T {
  const clampedStartTime = timeBlock.startTime.isBefore(start)
    ? start
    : timeBlock.startTime;
  const endTime = getEndTime(timeBlock);
  const clampedEndTime = endTime.isAfter(end) ? end : endTime;
  const clampedDurationMinutes = clampedEndTime.diff(
    clampedStartTime,
    "minutes",
  );

  return {
    ...timeBlock,
    startTime: clampedStartTime,
    durationMinutes: clampedDurationMinutes,
  };
}

export function getBlockProps(
  timeBlock: TimeBlock,
  settings: DayPlannerSettings,
) {
  const result: string[] = [];

  if (settings.showTimestampInTaskBlock && isWithTime(timeBlock)) {
    result.push(
      createTimestamp(
        getMinutesSinceMidnight(timeBlock.startTime),
        timeBlock.durationMinutes,
        settings.timestampFormat,
        emDash,
      ),
    );
  }

  if (isRemote(timeBlock)) {
    result.push(timeBlock.calendar.name);
  }

  return result.join(` ${bullet} `);
}

export function toRenderableMarkdown(timeBlock: Node) {
  const formattedFirstLine = flow(
    getFirstLineAsMarkdown,
    (node) => (timeBlock.status ? node : removeListTokens(node)),
    deleteProps,
    removeTimeRange,
  )(timeBlock);

  const [, ...linesAfterFirst] = timeBlock.text.split("\n");

  const nestedListItems = timeBlock.children
    ?.map((child) => getIndentedText(child))
    .join("\n");

  return {
    listItem: formattedFirstLine,
    paragraphs: linesAfterFirst.join("\n"),
    nestedListItems,
  };
}

function getIndentedText(root: Node, parentIndentation: string = ""): string {
  const firstLine = getFirstLineAsMarkdown(root);
  const [, ...linesAfterFirst] = root.text.split("\n");

  let listItemLineWithParagraphs = parentIndentation + firstLine;

  if (linesAfterFirst) {
    const indentedParagraphs = indentLines(
      linesAfterFirst,
      parentIndentation + getIndentationForListParagraph(),
    ).join("\n");

    listItemLineWithParagraphs += "\n";
    listItemLineWithParagraphs += indentedParagraphs;
  }

  return (root.children ?? []).reduce<string>((result, current) => {
    const indentation = "\t" + parentIndentation;

    return result + "\n" + getIndentedText(current, indentation);
  }, listItemLineWithParagraphs);
}

export function isCompleted(taskCheckmark?: string) {
  return taskCheckmark !== undefined && taskCheckmark.toLowerCase() === "x";
}
