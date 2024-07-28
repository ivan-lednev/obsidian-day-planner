import { partition } from "lodash/fp";
import { Moment } from "moment/moment";
import { STask } from "obsidian-dataview";

import { timeFromStartRegExp } from "../regexp";
import { DayPlannerSettings } from "../settings";
import { Task } from "../types";

import { toTask, toUnscheduledTask } from "./dataview";

function isTimeSetOnTask(task: STask) {
  return timeFromStartRegExp.test(task.text);
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

  const { parsed: tasksWithTime, errors } = withTime.reduce(
    (result, sTask) => {
      // todo: remove once proper handling is in place
      try {
        const task = toTask(sTask, day);

        result.parsed.push(task);
      } catch (error) {
        result.errors.push(error);
      }

      return result;
    },
    { parsed: [], errors: [] },
  );

  tasksWithTime.sort((a, b) => a.startMinutes - b.startMinutes);

  const noTime = withoutTime
    // todo: move out
    .filter((sTask) => {
      if (!sTask.task) {
        return false;
      }

      if (settings.showUnscheduledNestedTasks) {
        return true;
      }

      return !sTask.parent;
    })
    .map((sTask: STask) => toUnscheduledTask(sTask, day));

  const withTimeAndDuration = calculateDuration(tasksWithTime, settings);

  return { withTime: withTimeAndDuration, noTime, errors };
}
