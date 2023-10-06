import { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataviewApi, STask, DateTime } from "obsidian-dataview";

import { createPlanItem } from "../parser/parser";
import { timeRegExp } from "../regexp";
import { PlanItem } from "../types";
import { getId } from "../util/id";
import { getDiffInMinutes, getMinutesSinceMidnight } from "../util/moment";

type Node = { text: string; children: Node[]; scheduled?: DateTime };

function sTaskToString(node: Node, indentation = "") {
  let result = `- ${node.text}\n`;

  for (const child of node.children) {
    if (!child.scheduled && !timeRegExp.test(child.text)) {
      result += indentation + sTaskToString(child, `\t${indentation}`);
    }
  }

  return result;
}

function sTaskToPlanItem(sTask: STask, day: Moment): PlanItem {
  const { startTime, endTime, firstLineText, text } = createPlanItem({
    line: `- ${sTask.text}`,
    completeContent: sTaskToString(sTask),
    day,
    location: {
      path: sTask.path,
      line: sTask.line,
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
      endTime || startTime.clone().add(30, "minutes"),
      startTime,
    ),
    startMinutes: getMinutesSinceMidnight(startTime),
    location: {
      path: sTask.path,
      line: sTask.line,
    },
    id: getId(),
  };
}

export class DataviewFacade {
  constructor(private readonly dataview: () => DataviewApi) {}

  getTasksFor(day: Moment): PlanItem[] {
    // todo: what if it doesn't exist?
    const noteForDay = getDailyNote(day, getAllDailyNotes());

    return this.dataview()
      .pages()
      .file.tasks.where((task: STask) => {
        if (!timeRegExp.test(task.text)) {
          return false;
        }

        if (task.path === noteForDay.path) {
          return true;
        }

        if (!task.scheduled) {
          return false;
        }

        const scheduledMoment = window.moment(task.scheduled.toMillis());

        return scheduledMoment.isSame(day, "day");
      })
      .map((sTask: STask) => sTaskToPlanItem(sTask, day));
  }
}
