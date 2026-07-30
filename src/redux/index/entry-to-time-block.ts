import type { Moment } from "moment";

import type { LogTimeBlock, PlanTimeBlock } from "../../time-block-types";
import { strictParse, toMinutePrecision } from "../../util/moment";

import type {
  ClosedLogEntry,
  FileSystemEntry,
  ListItemEntry,
  ListItemEntryWithChildren,
  LogEntry,
  PlanEntry,
} from "./index-slice";

// todo: this should not be in the type at all
const frontmatterLogSymbol = "-";

interface TimeBlockTime {
  startTime: Moment;
  durationMinutes: number;
}

function toTimeBlockTime(start: Moment, end: Moment): TimeBlockTime {
  const startTime = toMinutePrecision(start);
  const endTime = toMinutePrecision(end);

  return { startTime, durationMinutes: endTime.diff(startTime, "minutes") };
}

// todo: use a type discriminant instead of all invocations of this
export function isListItemEntry(
  entry: ListItemEntry | FileSystemEntry,
): entry is ListItemEntry {
  return "position" in entry;
}

function toLogTimeBlock(props: {
  logEntry: LogEntry;
  parentEntry: ListItemEntry | FileSystemEntry;
  endTime: Moment;
  isRunning: boolean;
  listItemEntryWithChildren?: ListItemEntryWithChildren;
}): LogTimeBlock {
  const {
    logEntry,
    parentEntry,
    endTime,
    isRunning,
    listItemEntryWithChildren,
  } = props;

  const base = {
    ...toTimeBlockTime(strictParse(logEntry.start), endTime),
    id: logEntry.id,
    text: parentEntry.text,
    isRunning,
    children: listItemEntryWithChildren?.children,
    path: parentEntry.path,
  };

  if (isListItemEntry(parentEntry)) {
    if (logEntry.source === "frontmatterLog") {
      throw new Error(
        "Inconsistent store state: a frontmatter log entry cannot be attached to a list item",
      );
    }

    return {
      ...base,
      source: logEntry.source,
      status: parentEntry.task,
      task: parentEntry.task,
      symbol: parentEntry.symbol,
      position: parentEntry.position,
    };
  }

  if (logEntry.source !== "frontmatterLog") {
    throw new Error(
      "Inconsistent store state: only frontmatter log entries can be attached to file entries",
    );
  }

  return {
    ...base,
    source: logEntry.source,
    symbol: frontmatterLogSymbol,
  };
}

/**
 * Turns a log entry that may still be running into a time block. Open clocks
 * are resolved against `currentTime`.
 */
export function logEntryToTimeBlock(props: {
  logEntry: LogEntry;
  parentEntry: ListItemEntry | FileSystemEntry;
  currentTime: Moment;
  listItemEntryWithChildren?: ListItemEntryWithChildren;
}): LogTimeBlock {
  const { logEntry, currentTime, ...rest } = props;

  return toLogTimeBlock({
    ...rest,
    logEntry,
    endTime: logEntry.end ? strictParse(logEntry.end) : currentTime,
    isRunning: logEntry.end === undefined,
  });
}

export function closedLogEntryToTimeBlock(props: {
  logEntry: ClosedLogEntry;
  parentEntry: ListItemEntry | FileSystemEntry;
  listItemEntryWithChildren?: ListItemEntryWithChildren;
}): LogTimeBlock {
  const { logEntry, ...rest } = props;

  return toLogTimeBlock({
    ...rest,
    logEntry,
    endTime: strictParse(logEntry.end),
    isRunning: false,
  });
}

export function planEntryToTimeBlock(props: {
  planEntry: PlanEntry;
  parentEntry: ListItemEntry;
  listItemEntryWithChildren?: ListItemEntryWithChildren;
}): PlanTimeBlock {
  const { planEntry, parentEntry, listItemEntryWithChildren } = props;

  return {
    ...toTimeBlockTime(
      strictParse(planEntry.start),
      strictParse(planEntry.end),
    ),
    id: planEntry.id,
    text: parentEntry.text,
    source: planEntry.source,
    status: parentEntry.task,
    task: parentEntry.task,
    symbol: parentEntry.symbol,
    path: parentEntry.path,
    position: parentEntry.position,
    isAllDayEvent: planEntry.isAllDay,
    children: listItemEntryWithChildren?.children,
  };
}
