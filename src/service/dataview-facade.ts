import { Moment } from "moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { DateTime, STask } from "obsidian-dataview";

import {
  defaultDurationMinutes,
  indentBeforeTaskParagraph,
} from "../constants";
import { createTask } from "../parser/parser";
import { timeFromStartRegExp } from "../regexp";
import { Task } from "../types";
import { clockToTime, parseClock } from "../util/clock";
import { getId } from "../util/id";
import { getDiffInMinutes, getMinutesSinceMidnight } from "../util/moment";

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
  scheduled?: DateTime;
}

export function sTaskLineToString(node: Node) {
  const status = node.status ? `[${node.status}] ` : "";
  return `${node.symbol} ${status}${node.text}\n`;
}

export function sTaskToString(node: Node, indentation = "") {
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

  const durationMinutes = endTime?.isAfter(startTime)
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

export function getScheduledDay(sTask: STask) {
  const scheduledPropDay = sTask.scheduled?.toFormat?.("yyyy-MM-dd"); // luxon
  const dailyNoteDay = getDateFromPath(sTask.path, "day")?.format(
    "YYYY-MM-DD", // moment
  );

  return scheduledPropDay || dailyNoteDay;
}

// todo: separate notions of UI clock/property `clocked`/a pair of start-end
export function sTaskToClocks(sTask: STask, rawClock: string | []) {
  if (Array.isArray(rawClock)) {
    return rawClock.map((clock: string) => sTaskToClocks(sTask, clock));
  }

  const parsedClock = parseClock(rawClock);

  if (!parsedClock) {
    return null;
  }

  // todo: use factory
  return {
    ...clockToTime(parsedClock),
    startTime: parsedClock.start,
    firstLineText: sTaskLineToString(sTask),
    text: sTaskToString(sTask),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function toMarkdown(sTask: STask) {
  const baseIndent = "\t".repeat(sTask.position.start.col);
  const extraIndent = " ".repeat(indentBeforeTaskParagraph);

  return sTask.text
    .split("\n")
    .map((line, i) => {
      if (i === 0) {
        // TODO: remove duplication
        return `${baseIndent}${sTask.symbol} [${sTask.status}] ${line}`;
      }

      return `${baseIndent}${extraIndent}${line}`;
    })
    .join("\n");
}
