import { partition } from "lodash/fp";
import type { Moment } from "moment/moment";
import { STask } from "obsidian-dataview";

import { testTimestampPatterns } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";
import type { LocalTask, TaskWithoutComputedDuration } from "../task-types";

import * as dataview from "./dataview";
import { getMinutesSinceMidnight } from "./moment";

type DurationOptions = Pick<
  DayPlannerSettings,
  "defaultDurationMinutes" | "extendDurationUntilNext"
>;

function calculateDuration(
  tasks: TaskWithoutComputedDuration[],
  options: DurationOptions,
): LocalTask[] {
  return tasks.map((current, i, array): LocalTask => {
    if (current.durationMinutes) {
      return current as LocalTask;
    }

    const next = array[i + 1];
    const shouldExtendUntilNext = next && options.extendDurationUntilNext;

    if (shouldExtendUntilNext) {
      const minutesUntilNext =
        getMinutesSinceMidnight(next.startTime) -
        getMinutesSinceMidnight(current.startTime);

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
  // todo: since we don't need to preserve this partition, we can shorten this
  const [withTime, withoutTime] = partition(
    ({ text }) => testTimestampPatterns(text),
    tasksForDay,
  );

  const { parsed: tasksWithoutComputedDuration } = withTime.reduce<{
    parsed: TaskWithoutComputedDuration[];
    errors: unknown[];
  }>(
    (result, sTask) => {
      try {
        const task = dataview.toTask(sTask, day);

        result.parsed.push(task);
      } catch (error) {
        result.errors.push(error);
      }

      return result;
    },
    { parsed: [], errors: [] },
  );

  tasksWithoutComputedDuration.sort((a, b) => a.startTime.diff(b.startTime));
  const withTimeAndDuration = calculateDuration(
    tasksWithoutComputedDuration,
    settings,
  );

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
    .map((sTask: STask) => dataview.toUnscheduledTask(sTask, day));

  return [...withTimeAndDuration, ...noTime];
}
