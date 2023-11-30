import { partition } from "lodash/fp";
import { Moment } from "moment/moment";
import { TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataArray, STask } from "obsidian-dataview";

import { timeFromStartRegExp } from "../regexp";
import {
  sTaskToTask,
  sTaskToUnscheduledTask,
} from "../service/dataview-facade";
import { DayPlannerSettings } from "../settings";
import { Task, TasksForDay } from "../types";

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

function calculateDuration(tasks: Task[], options: DurationOptions) {
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

export function mapToTasksForDay(
  day: Moment,
  tasksForDay: STask[],
  settings: DayPlannerSettings,
) {
  const [withTime, withoutTime] = partition(isTimeSetOnTask, tasksForDay);

  const tasksWithTime = withTime
    .reduce((result, sTask) => {
      try {
        const task = sTaskToTask(sTask, day);

        result.push(task);
      } catch (error) {
        console.error(`Could not parse Dataview task: ${error}`);
      }

      return result;
    }, [])
    // todo: sortByStartMinutes()
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const noTime = withoutTime
    .filter((sTask) =>
      settings.showUnscheduledNestedTasks ? true : !sTask.parent,
    )
    .map((sTask: STask) => sTaskToUnscheduledTask(sTask, day));

  const withTimeAndDuration = calculateDuration(tasksWithTime, settings);

  return { withTime: withTimeAndDuration, noTime };
}

export function getTasksForDay(
  day: Moment,
  dataviewTasks: DataArray<STask>,
  settings: DayPlannerSettings,
): TasksForDay {
  if (dataviewTasks.length === 0) {
    return { withTime: [], noTime: [] };
  }

  const noteForThisDay = getDailyNote(day, getAllDailyNotes());

  const sTasksForDay = dataviewTasks
    .where(
      (task: STask) =>
        !isScheduledForAnotherDay(task, day) &&
        (isScheduledForThisDay(task, day) ||
          isTaskInFile(task, noteForThisDay)),
    )
    .array();

  return mapToTasksForDay(day, sTasksForDay, settings);
}
