import { partition } from "lodash/fp";
import { Moment } from "moment/moment";
import { TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataArray, STask } from "obsidian-dataview";

import { timeFromStartRegExp } from "../regexp";
import {
  sTaskToPlanItem,
  sTaskToUnscheduledPlanItem,
} from "../service/dataview-facade";
import { DayPlannerSettings } from "../settings";
import { PlanItem, UnscheduledPlanItem } from "../types";

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
): {
  scheduled: PlanItem[];
  unscheduled: UnscheduledPlanItem[];
} {
  if (dataviewTasks.length === 0) {
    return { scheduled: [], unscheduled: [] };
  }

  const noteForThisDay = getDailyNote(day, getAllDailyNotes());

  const tasksForDay = dataviewTasks
    .where(
      (task: STask) =>
        !isScheduledForAnotherDay(task, day) &&
        (isScheduledForThisDay(task, day) ||
          isTaskInFile(task, noteForThisDay)),
    )
    .array();

  const [withTime, withoutTime] = partition(isTimeSetOnTask, tasksForDay);

  const tasksWithTime = withTime
    .map((sTask: STask) => sTaskToPlanItem(sTask, day))
    .sort((task: PlanItem) => task.startMinutes);

  const tasksWithoutTime = withoutTime.map((sTask: STask) =>
    sTaskToUnscheduledPlanItem(sTask, day),
  );

  const scheduled = calculateDuration(tasksWithTime, options);

  // todo: better: withTime, withoutTime
  return { scheduled, unscheduled: tasksWithoutTime };
}
