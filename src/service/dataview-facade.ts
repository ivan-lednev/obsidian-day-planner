import { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataviewApi, STask, DateTime } from "obsidian-dataview";

import { defaultDurationMinutes } from "../constants";
import { createPlanItem } from "../parser/parser";
import { timeRegExp } from "../regexp";
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

  return {
    startTime,
    rawStartTime: "-",
    rawEndTime: "-",
    listTokens: `${sTask.symbol} [${sTask.status}] `,
    firstLineText,
    text,
    durationMinutes: getDiffInMinutes(
      endTime || startTime.clone().add(defaultDurationMinutes, "minutes"),
      startTime,
    ),
    startMinutes: getMinutesSinceMidnight(startTime),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}

export class DataviewFacade {
  constructor(private readonly dataview: () => DataviewApi) {}

  getTasksFor(day: Moment): PlanItem[] {
    const noteForDay = getDailyNote(day, getAllDailyNotes());

    return this.dataview()
      .pages()
      .file.tasks.where((task: STask) => {
        if (!timeRegExp.test(task.text)) {
          return false;
        }

        if (task.path === noteForDay?.path) {
          return true;
        }

        if (!task.scheduled) {
          return false;
        }

        const scheduledMoment = window.moment(task.scheduled.toMillis());

        return scheduledMoment.isSame(day, "day");
      })
      .map((sTask: STask) => sTaskToPlanItem(sTask, day))
      .sort((task: PlanItem) => task.startMinutes)
      .array();
  }
}
