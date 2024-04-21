import { Moment } from "moment/moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { DataArray, DateTime, STask } from "obsidian-dataview";

import {
  defaultDayFormat,
  defaultDayFormatForLuxon,
  defaultDurationMinutes,
  indentBeforeTaskParagraph,
} from "../constants";
import { createTask } from "../parser/parser";
import { timeFromStartRegExp } from "../regexp";
import { Task } from "../types";

import { ClockMoments, toTime } from "./clock";
import { getId } from "./id";
import { getDiffInMinutes, getMinutesSinceMidnight } from "./moment";
import { deleteProps } from "./properties";

export function unwrap<T>(group: ReturnType<DataArray<T>["groupBy"]>) {
  return group.map(({ key, rows }) => [key, rows.array()]).array();
}

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
  scheduled?: DateTime;
}

export function textToString(node: Node) {
  const status = node.status ? `[${node.status}] ` : "";
  return `${node.symbol} ${status}${deleteProps(node.text)}\n`;
}

// todo: remove duplication: toMarkdown
export function toString(node: Node, indentation = "") {
  let result = `${indentation}${textToString(node)}`;

  for (const child of node.children) {
    if (!child.scheduled && !timeFromStartRegExp.test(child.text)) {
      result += toString(child, `\t${indentation}`);
    }
  }

  return result;
}

export function toUnscheduledTask(sTask: STask, day: Moment) {
  return {
    durationMinutes: defaultDurationMinutes,
    // todo: bad abstraction
    listTokens: getListTokens(sTask),
    firstLineText: sTask.text,
    text: toString(sTask),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function toTask(sTask: STask, day: Moment): Task {
  const { startTime, endTime, firstLineText, text } = createTask({
    line: textToString(sTask),
    completeContent: toString(sTask),
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
    listTokens: getListTokens(sTask),
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
  const scheduledPropDay: string = sTask.scheduled?.toFormat?.(
    defaultDayFormatForLuxon,
  );
  const dailyNoteDay = getDateFromPath(sTask.path, "day")?.format(
    defaultDayFormat,
  );

  return scheduledPropDay || dailyNoteDay;
}

export function toClockRecord(sTask: STask, clockMoments: ClockMoments) {
  // TODO: remove duplication
  return {
    ...toTime(clockMoments),
    startTime: clockMoments[0],
    firstLineText: textToString(sTask),
    text: toString(sTask),
    listTokens: "",
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
        return `${baseIndent}${getListTokens(sTask)}${line}`;
      }

      return `${baseIndent}${extraIndent}${line}`;
    })
    .join("\n");
}

function getListTokens(sTask: STask) {
  const maybeCheckbox = sTask.status === undefined ? "" : `[${sTask.status}] `;
  return `${sTask.symbol} ${maybeCheckbox}`;
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
