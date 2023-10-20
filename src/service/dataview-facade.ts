import { Moment } from "moment";
import { STask, DateTime } from "obsidian-dataview";

import { defaultDurationMinutes } from "../constants";
import { createPlanItem } from "../parser/parser";
import { parseTimestamp } from "../parser/timestamp/timestamp";
import { sTaskTimestampRegExp, timeRegExp } from "../regexp";
import { PlanItem } from "../types";
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
    if (!child.scheduled && !timeRegExp.test(child.text)) {
      result += sTaskToString(child, `\t${indentation}`);
    }
  }

  return result;
}

export function sTaskToUnscheduledPlanItem(sTask: STask, day: Moment) {
  return {
    durationMinutes: defaultDurationMinutes,
    listTokens: `${sTask.symbol} [${sTask.status}] `,
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

function parseTime(line: string, day: Moment) {
  const match = sTaskTimestampRegExp.exec(line);

  if (!match) {
    return {};
  }

  const {
    groups: { start, end },
  } = match;

  const startTime = parseTimestamp(start, day);
  const endTime = parseTimestamp(end, day);
  const startMinutes = getMinutesSinceMidnight(startTime);
  const durationMinutes = endTime
    ? getDiffInMinutes(endTime, startTime)
    : undefined;

  return {
    startTime,
    startMinutes,
    durationMinutes,
  };
}

export function sTaskToPlanItem(sTask: STask, day: Moment): PlanItem {
  const { startTime, endTime, firstLineText, text } = createPlanItem({
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
