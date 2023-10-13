import { Moment } from "moment/moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataArray, STask } from "obsidian-dataview";

import { timeRegExp } from "../regexp";
import { sTaskToPlanItem } from "../service/dataview-facade";
import { PlanItem } from "../types";

export function getTasksForDay(day: Moment, dataviewTasks: DataArray<STask>) {
  const noteForDay = getDailyNote(day, getAllDailyNotes());

  return dataviewTasks
    .where((task: STask) => {
      const timeIsSet = timeRegExp.test(task.text);

      if (!timeIsSet) {
        return false;
      }

      const isInDailyNote = task.path === noteForDay?.path;

      if (isInDailyNote) {
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
