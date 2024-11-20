import { isString, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import {
  clockKey,
  defaultDayFormat,
  defaultDayFormatForLuxon,
  defaultDurationMinutes,
  indentBeforeListParagraph,
  indentBeforeTaskParagraph,
} from "../constants";
import { getTimeFromLine } from "../parser/parser";
import type {
  FileLine,
  LocalTask,
  TaskTokens,
  TaskWithoutComputedDuration,
} from "../task-types";

import {
  areValidClockMoments,
  type ClockMoments,
  toClockMoments,
} from "./clock";
import { getId } from "./id";
import { liftToArray } from "./lift";
import { splitMultiday } from "./moment";
import { getFirstLine } from "./task-utils";
import { indent, indentLines } from "./util";

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
}

const baseIndentation = "\t";

// todo: account for user settings
export function createIndentation(level: number) {
  return baseIndentation.repeat(level);
}

export function getIndentationForListParagraph(sTask: Node) {
  const isListItem = sTask.status === undefined;

  return " ".repeat(
    isListItem ? indentBeforeListParagraph : indentBeforeTaskParagraph,
  );
}

export function textToMarkdown(sTask: Node) {
  const indentationForListParagraph = getIndentationForListParagraph(sTask);

  const [firstLine, ...otherLines] = sTask.text.split("\n");

  const withIndentation = [
    `${createMarkdownListTokens(sTask)} ${firstLine}`,
    ...indentLines(otherLines, indentationForListParagraph),
  ];

  return withIndentation.join("\n");
}

const indentationPerLevel = "\t";

// todo: use createIndentation
export function toString(node: Node, parentIndentation = "") {
  const nodeText = indent(textToMarkdown(node), parentIndentation);

  return node.children.reduce((result, current) => {
    const indentation = `${indentationPerLevel}${parentIndentation}`;

    return `${result}
${toString(current, indentation)}`;
  }, nodeText);
}

export function getLines(node: STask, result: Array<FileLine> = []) {
  result.push({ text: node.text, line: node.line, task: node.task });

  for (const child of node.children) {
    getLines(child, result);
  }

  return result;
}

export function toTaskWithClock(props: {
  sTask: STask;
  clockMoments: ClockMoments;
}): LocalTask {
  const { sTask, clockMoments } = props;
  const [startTime, endTime] = clockMoments;
  let durationMinutes = endTime.diff(startTime, "minutes");

  if (durationMinutes < 0) {
    durationMinutes = defaultDurationMinutes;
  }

  return {
    // todo: remove moment
    ...toUnscheduledTask(sTask, window.moment()),
    isAllDayEvent: false,
    startTime,
    durationMinutes,
  };
}

export function toTaskWithActiveClock(sTask: STask, startTime: Moment) {
  // todo: remove duplication
  return {
    ...toUnscheduledTask(sTask, startTime),
    isAllDayEvent: false,
    startTime,
  };
}

export function toUnscheduledTask(sTask: STask, startTime: Moment) {
  return {
    isAllDayEvent: true,
    startTime,
    durationMinutes: defaultDurationMinutes,
    symbol: sTask.symbol,
    status: sTask.status,
    text: toString(sTask),
    lines: getLines(sTask),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function toTask(sTask: STask, day: Moment): TaskWithoutComputedDuration {
  const parsedTime = getTimeFromLine({
    line: getFirstLine(sTask.text),
    day,
  });

  isNotVoid(
    parsedTime,
    `Unexpectedly received an STask without a timestamp: ${sTask.text}`,
  );

  const { startTime, durationMinutes } = parsedTime;

  return {
    startTime,
    symbol: sTask.symbol,
    status: sTask.status,
    text: toString(sTask),
    lines: getLines(sTask),
    durationMinutes,
    location: {
      path: sTask.path,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function getScheduledDay(sTask: STask) {
  const scheduledPropDay: string = sTask.scheduled?.toFormat?.(
    defaultDayFormatForLuxon,
  );
  const dailyNoteDay = getDateFromPath(sTask.path, "day")?.format(
    defaultDayFormat,
  );

  return scheduledPropDay || dailyNoteDay;
}

export function textToMarkdownWithIndentation(sTask: STask) {
  return indent(
    textToMarkdown(sTask),
    createIndentation(sTask.position.start.col),
  );
}

function checkbox(status: string) {
  return `[${status}]`;
}

export function createMarkdownListTokens(task: TaskTokens) {
  if (task.status === undefined) {
    return task.symbol;
  }

  return `${task.symbol} ${checkbox(task.status)}`;
}

export function replaceSTaskText(
  contents: string,
  sTask: STask,
  newText: string,
) {
  const lines = contents.split("\n");
  const deleteCount = sTask.position.end.line - sTask.position.start.line + 1;

  lines.splice(sTask.position.start.line, deleteCount, newText);

  return lines.join("\n");
}

export function withClockMoments(sTask: STask) {
  return liftToArray(sTask[clockKey])
    .filter(isString)
    .map(toClockMoments)
    .filter(areValidClockMoments)
    .flatMap(([start, end]) => splitMultiday(start, end))
    .map((clockMoments) => ({
      sTask,
      clockMoments,
    }));
}

export const uniq = uniqBy(
  (task: STask) => `${task.path}::${task.position.start.line}`,
);
