import type { Moment } from "moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import {
  defaultDayFormat,
  defaultDayFormatForLuxon,
  defaultDurationMinutes,
  indentBeforeTaskParagraph,
} from "../constants";
import { getTimeFromLine } from "../parser/parser";
import type {
  FileLine,
  LocalTask,
  TaskTokens,
  TaskWithoutComputedDuration,
} from "../task-types";

import { type ClockMoments } from "./clock";
import { getId } from "./id";
import { indent } from "./util";

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
}

export function textToMarkdown(sTask: Node) {
  return `${createMarkdownListTokens(sTask)} ${sTask.text}`;
}

const indentationPerLevel = "\t";

export function toString(node: Node, parentIndentation = "") {
  const nodeText = indent(textToMarkdown(node), parentIndentation);

  return node.children.reduce((result, current) => {
    const indentation = `${indentationPerLevel}${parentIndentation}`;

    return `${result}
${toString(current, indentation)}`;
  }, nodeText);
}

export function getLines(node, result: Array<FileLine> = []) {
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
    line: sTask.text,
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

// todo: delete
export function toMarkdown(sTask: STask) {
  const baseIndent = "\t".repeat(sTask.position.start.col);
  const extraIndent = " ".repeat(indentBeforeTaskParagraph);

  return sTask.text
    .split("\n")
    .map((line, i) => {
      if (i === 0) {
        return `${baseIndent}${createMarkdownListTokens(sTask)} ${line}`;
      }

      return `${baseIndent}${extraIndent}${line}`;
    })
    .join("\n");
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

export function replaceSTaskInFile(
  contents: string,
  sTask: STask,
  newText: string,
) {
  const lines = contents.split("\n");
  // todo: this is not going to work: it doesn't consider sub-task lines
  const deleteCount = sTask.position.end.line - sTask.position.start.line + 1;

  lines.splice(sTask.position.start.line, deleteCount, newText);

  return lines.join("\n");
}
