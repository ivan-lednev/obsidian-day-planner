import type { Moment } from "moment";
import { STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import {
  defaultDurationMinutes,
  indentBeforeListParagraph,
} from "../constants";
import { getTimeFromLine } from "../parser/parser";
import type {
  FileLine,
  TaskTokens,
  TaskWithoutComputedDuration,
} from "../task-types";

import { getId } from "./id";
import {
  checkbox,
  createIndentation,
  getFirstLine,
  indent,
  indentLines,
} from "./markdown";

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
}

export function getIndentationForListParagraph() {
  return " ".repeat(indentBeforeListParagraph);
}

export function textToMarkdown(sTask: Node) {
  const indentationForListParagraph = getIndentationForListParagraph();

  const [firstLine, ...otherLines] = sTask.text.split("\n");

  const withIndentation = [
    `${createMarkdownListTokens(sTask)} ${firstLine}`,
    ...indentLines(otherLines, indentationForListParagraph),
  ];

  return withIndentation.join("\n");
}

const indentationPerLevel = "\t";

// todo: use createIndentation
export function toString(node: Node, parentIndentation = ""): string {
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

export function textToMarkdownWithIndentation(sTask: STask) {
  return indent(
    textToMarkdown(sTask),
    createIndentation(sTask.position.start.col),
  );
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
