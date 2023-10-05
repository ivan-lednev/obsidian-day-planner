import { Moment } from "moment";
import { DataviewApi, STask } from "obsidian-dataview";

import { createPlanItem } from "../parser/parser";
import { PlanItem } from "../types";
import { getId } from "../util/id";
import { getDiffInMinutes, getMinutesSinceMidnight } from "../util/moment";

function sTaskToPlanItem(sTask: STask): PlanItem {
  const { startTime, endTime, firstLineText, text } = createPlanItem({
    line: `- ${sTask.text}`,
    completeContent: `- ${sTask.text}`,
    day: window.moment(sTask.scheduled.toMillis()),
    location: {
      path: sTask.path,
      line: sTask.line,
    },
  });

  return {
    startTime,
    rawStartTime: "-",
    rawEndTime: "-",
    listTokens: `${sTask.symbol} `,
    firstLineText,
    text,
    durationMinutes: getDiffInMinutes(endTime, startTime),
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
    return this.dataview()
      .pages()
      .file.tasks.where(
        (task: STask) =>
          task.scheduled &&
          window.moment(task.scheduled.toMillis()).isSame(day, "day"),
      )
      .map(sTaskToPlanItem);
  }
}
