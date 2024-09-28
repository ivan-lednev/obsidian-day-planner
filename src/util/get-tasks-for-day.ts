import { partition } from "lodash/fp";
import type { Moment } from "moment/moment";
import { STask } from "obsidian-dataview";

import { testTimestampPatterns } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask, WithTime } from "../task-types";

import { toTask, toUnscheduledTask } from "./dataview";

type DurationOptions = Pick<
  DayPlannerSettings,
  "defaultDurationMinutes" | "extendDurationUntilNext"
>;

function calculateDuration(
  tasks: WithTime<LocalTask>[],
  options: DurationOptions,
) {
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
  const [withTime, withoutTime] = partition(
    ({ text }) => testTimestampPatterns(text),
    tasksForDay,
  );

  const { parsed: tasksWithTime, errors } = withTime.reduce<{
    parsed: WithTime<LocalTask>[];
    errors: unknown[];
  }>(
    (result, sTask) => {
      try {
        const task = toTask(sTask, day, settings);

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
    .filter((sTask) => {
      if (!sTask.task || sTask.text.trim().length === 0) {
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
