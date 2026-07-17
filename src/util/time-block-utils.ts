import { pipe } from "effect";
import type { Moment } from "moment";
import { get } from "svelte/store";

import { bullet, defaultDayFormat, emDash } from "../constants";
import { settings } from "../global-store/settings";
import { replaceOrPrependTimeRange } from "../parser/parser";
import {
  obsidianBlockIdRegExp,
  timeRangeAtStartOfLineRegExp,
  timeRangeRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  isListItemSourced,
  isRemote,
  type EditableTimeBlock,
  type PlanTimeBlock,
  type RemoteTimeBlock,
  type TimeBlock,
  type UnwrittenTimeBlock,
  type WithDuration,
  type WriteDestination,
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

export function isWithDuration<T extends TimeBlock>(
  timeBlock: T,
): timeBlock is WithDuration<T> {
  return Object.hasOwn(timeBlock, "durationMinutes");
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

  if (isWithDuration(timeBlock)) {
    key.push(
      String(getMinutesSinceMidnight(timeBlock.startTime)),
      String(getEndMinutes(timeBlock)),
    );
  }

  if (isListItemSourced(timeBlock)) {
    const {
      path,
      position: {
        start: { line },
      },
    } = timeBlock;

    key.push(path, String(line));
  }

  key.push(timeBlock.text);

  return key.join(keySeparator);
}

export function getNotificationKey(timeBlock: WithDuration<PlanTimeBlock>) {
  if (isRemote(timeBlock)) {
    return getRemoteTimeBlockIdentity(timeBlock);
  }

  const key: string[] = [];

  key.push(
    timeBlock.path,
    String(getMinutesSinceMidnight(timeBlock.startTime)),
    String(timeBlock.durationMinutes),
    timeBlock.text,
  );

  return key.join(keySeparator);
}

/**
 * Copies of tasks-plugin blocks go right under the original block, copies of
 * daily-note blocks get sent under the planner heading of the note matching
 * their start time.
 */
export function copy(
  original: WithDuration<EditableTimeBlock>,
): WithDuration<UnwrittenTimeBlock> {
  if (original.source === "unwritten") {
    throw new Error("Cannot copy unwritten time blocks");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { path, position, ...withoutFileLocation } = original;

  return {
    ...withoutFileLocation,
    source: "unwritten",
    destination: getCopyDestination(original),
    id: getId(),
  };
}

function getCopyDestination(original: PlanTimeBlock): WriteDestination {
  if (original.source === "tasksPluginProp") {
    return {
      type: "line",
      path: original.path,
      line: original.position.end.line + 1,
    };
  }

  return { type: "plannerHeading" };
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

export function toString(timeBlock: WithDuration<EditableTimeBlock>) {
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
}): WithDuration<UnwrittenTimeBlock> {
  const { day, startMinutes, settings } = props;

  return {
    id: getId(),
    source: "unwritten",
    destination: { type: "plannerHeading" },
    durationMinutes: settings.defaultDurationMinutes,
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    isAllDayEvent: false,
    symbol: "-",
    status:
      settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function getOneLineSummary(timeBlock: TimeBlock) {
  if (isRemote(timeBlock)) {
    return timeBlock.summary;
  }

  return pipe(timeBlock.text, getFirstLine, removeTimeRangeFromStartOfLine);
}

export function truncateToRange<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  range: m.Range,
): T {
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

export function isTimeEqual(a: EditableTimeBlock, b: EditableTimeBlock) {
  return (
    a.startTime.isSame(b.startTime) &&
    a.durationMinutes === b.durationMinutes &&
    a.isAllDayEvent === b.isAllDayEvent
  );
}

export function clamp<T extends WithDuration<TimeBlock>>(
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

  if (settings.showTimestampInTaskBlock && isWithDuration(timeBlock)) {
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
  const formattedFirstLine = pipe(
    timeBlock,
    getFirstLineAsMarkdown,
    (node) => (timeBlock.status ? node : removeListTokens(node)),
    deleteProps,
    removeTimeRange,
  );

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
