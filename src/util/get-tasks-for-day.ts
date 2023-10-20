import { Moment } from "moment/moment";
import { TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataArray, STask } from "obsidian-dataview";

import { timeFromStartRegExp } from "../regexp";
import { sTaskToPlanItem } from "../service/dataview-facade";
import { DayPlannerSettings } from "../settings";
import { PlanItem } from "../types";

function isScheduledForThisDay(task: STask, day: Moment) {
  if (!task?.scheduled?.toMillis) {
    return false;
  }

  const scheduledMoment = window.moment(task.scheduled.toMillis());

  return scheduledMoment.isSame(day, "day");
}

function isTimeSetOnTask(task: STask) {
  return timeFromStartRegExp.test(task.text);
}

function isTaskInFile(task: STask, file?: TFile) {
  return task.path === file?.path;
}

function isScheduledForAnotherDay(task: STask, day: Moment) {
  return task.scheduled && !isScheduledForThisDay(task, day);
}

type DurationOptions = Pick<
  DayPlannerSettings,
  "defaultDurationMinutes" | "extendDurationUntilNext"
>;

function calculateDuration(tasks: PlanItem[], options: DurationOptions) {
  return tasks.map((current, i, array) => {
    if (current.durationMinutes) {
      return current;
    }

    const next = array[i + 1];
    const shouldExtendUntilNext = next && options.extendDurationUntilNext;

    if (shouldExtendUntilNext) {
      const minutesUntilNext = next.startMinutes - current.startMinutes;

      return {
        ...current,
        durationMinutes: minutesUntilNext,
      };
    }

    return {
      ...current,
      durationMinutes: options.defaultDurationMinutes,
    };
  });
}

export function getTasksForDay(
  day: Moment,
  dataviewTasks: DataArray<STask>,
  options: DurationOptions,
): PlanItem[] {
  if (dataviewTasks.length === 0) {
    return [];
  }

  const noteForThisDay = getDailyNote(day, getAllDailyNotes());

  const planItems = dataviewTasks
    .where(
      (task: STask) =>
        isTimeSetOnTask(task) &&
        !isScheduledForAnotherDay(task, day) &&
        (isScheduledForThisDay(task, day) ||
          isTaskInFile(task, noteForThisDay)),
    )
    .map((sTask: STask) => sTaskToPlanItem(sTask, day))
    .sort((task: PlanItem) => task.startMinutes)
    .array();

  return calculateDuration(planItems, options);
}
