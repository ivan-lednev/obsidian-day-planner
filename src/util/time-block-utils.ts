import { pipe } from "effect";
import type { Moment } from "moment";
import { get } from "svelte/store";

import { bullet, defaultDayFormat, emDash } from "../constants";
import { settingsStore } from "../global-store/settings";
import { replaceOrPrependTimeRange } from "../parser/parser";
import {
  obsidianBlockIdRegExp,
  timeRangeAtStartOfLineRegExp,
  timeRangeRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  isListItemSourced,
  isLocal,
  isLog,
  isRemote,
  type EditableTimeBlock,
  type PlanTimeBlock,
  type RemoteTimeBlock,
  type Side,
  type TimeBlock,
  type UnwrittenLogTimeBlock,
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
import { addMinutes, getMinutesSinceMidnight, minutesToMoment } from "./moment";
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

  return {
    text: original.text,
    status: original.status,
    symbol: original.symbol,
    task: original.task,
    startTime: original.startTime,
    durationMinutes: original.durationMinutes,
    isAllDayEvent: original.isAllDayEvent,
    truncated: original.truncated,
    children: original.children,
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

export function getDayKey(day: Moment) {
  return day.format(defaultDayFormat);
}

export function toString(timeBlock: WithDuration<EditableTimeBlock>) {
  const updatedTimestamp = createTimestamp(
    getMinutesSinceMidnight(timeBlock.startTime),
    timeBlock.durationMinutes,
    get(settingsStore).timestampFormat,
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
  startTime: Moment;
  settings: DayPlannerSettings;
}): WithDuration<UnwrittenTimeBlock> {
  const { startTime, settings } = props;

  return {
    id: getId(),
    source: "unwritten",
    destination: { type: "plannerHeading" },
    durationMinutes: settings.defaultDurationMinutes,
    text: "New item",
    startTime: startTime.clone(),
    isAllDayEvent: false,
    symbol: "-",
    status:
      settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function createLog(props: {
  startTime: Moment;
  settings: DayPlannerSettings;
}): WithDuration<UnwrittenLogTimeBlock> {
  const { startTime, settings } = props;

  return {
    id: getId(),
    source: "unwrittenLog",
    durationMinutes: settings.defaultDurationMinutes,
    text: "New clock",
    startTime: startTime.clone(),
    symbol: "-",
  };
}

export function getOneLineSummary(timeBlock: TimeBlock) {
  if (isRemote(timeBlock)) {
    return timeBlock.summary;
  }

  return pipe(timeBlock.text, getFirstLine, removeTimeRangeFromStartOfLine);
}

function clipToRange<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  range: m.Range,
  edges: { start: Side; end: Side },
): T {
  const clipped = { ...timeBlock };

  if (timeBlock.startTime.isBefore(range.start)) {
    clipped.startTime = range.start;
    clipped.durationMinutes = getEndTime(timeBlock).diff(
      range.start,
      "minutes",
    );
    clipped.truncated = [...(clipped.truncated ?? []), edges.start];
  }

  if (getEndTime(clipped).isAfter(range.end)) {
    clipped.durationMinutes = m.getDiffInMinutes(clipped.startTime, range.end);
    clipped.truncated = [...(clipped.truncated ?? []), edges.end];
  }

  return clipped;
}

export function clipToColumnRange<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  range: m.Range,
): T {
  return clipToRange(timeBlock, range, { start: "top", end: "bottom" });
}

export function clipToRowRange<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  range: m.Range,
): T {
  return clipToRange(timeBlock, range, { start: "left", end: "right" });
}

export function truncateToDayRange<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  range: m.Range,
): T {
  return clipToRowRange(timeBlock, {
    start: range.start.clone().startOf("day"),
    end: range.end.clone().add(1, "day").startOf("day"),
  });
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

export function getCutEdges(timeBlock: TimeBlock): Side[] {
  const cutEdges = timeBlock.truncated ?? [];

  if (!isLocal(timeBlock) || !isLog(timeBlock) || !timeBlock.isRunning) {
    return cutEdges;
  }

  return cutEdges.includes("bottom") ? cutEdges : [...cutEdges, "bottom"];
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

  if (linesAfterFirst.length > 0) {
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
