import { Moment } from "moment";
import { STask, DateTime } from "obsidian-dataview";

import { defaultDurationMinutes } from "../constants";
import { createTask } from "../parser/parser";
import { timeFromStartRegExp } from "../regexp";
import { Task } from "../types";
import { getId } from "../util/id";
import { getDiffInMinutes, getMinutesSinceMidnight } from "../util/moment";

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
  scheduled?: DateTime;
}

function sTaskLineToString(node: Node) {
  const status = node.status ? `[${node.status}] ` : "";
  return `${node.symbol} ${status}${node.text}\n`;
}

function sTaskToString(node: Node, indentation = "") {
  let result = `${indentation}${sTaskLineToString(node)}`;

  for (const child of node.children) {
    if (!child.scheduled && !timeFromStartRegExp.test(child.text)) {
      result += sTaskToString(child, `\t${indentation}`);
    }
  }

  return result;
}

export function sTaskToUnscheduledTask(sTask: STask, day: Moment) {
  return {
    durationMinutes: defaultDurationMinutes,
    listTokens: `${sTask.symbol} [${sTask.status}] `,
    firstLineText: sTask.text,
    text: sTaskToString(sTask),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function sTaskToTask(sTask: STask, day: Moment): Task {
  const { startTime, endTime, firstLineText, text } = createTask({
    line: sTaskLineToString(sTask),
    completeContent: sTaskToString(sTask),
    day,
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
  });

  const durationMinutes = endTime
    ? getDiffInMinutes(endTime, startTime)
    : undefined;

  return {
    startTime,
    listTokens: `${sTask.symbol} [${sTask.status}] `,
    firstLineText,
    text,
    durationMinutes,
    startMinutes: getMinutesSinceMidnight(startTime),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}
