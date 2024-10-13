import { mergeWith } from "lodash/fp";
import type { Root } from "mdast";
import type { Moment } from "moment/moment";
import {
  DEFAULT_DAILY_NOTE_FORMAT,
  getDateFromPath,
} from "obsidian-daily-notes-interface";
import { isNotVoid } from "typed-assert";

import {
  checkListItem,
  findFirst,
  fromMarkdown,
  insertListItemUnderHeading,
  isListItem,
} from "../mdast/mdast";
import { scheduledPropRegExps } from "../regexp";
import type { Update } from "../service/diff-writer";
import type { DayPlannerSettings } from "../settings";
import {
  type DayToTasks,
  isRemote,
  type LocalTask,
  type Task,
  type TasksForDay,
  type WithTime,
} from "../task-types";

import { createDailyNotePath } from "./daily-notes";
import { getMinutesSinceMidnight, minutesToMomentOfDay } from "./moment";
import { getFirstLine, updateTaskText } from "./task-utils";

export function getEmptyRecordsForDay(): TasksForDay {
  return { withTime: [], noTime: [] };
}

export function removeTask(task: WithTime<LocalTask>, tasks: TasksForDay) {
  return {
    ...tasks,
    noTime: tasks.noTime.filter((t) => t.id !== task.id),
    withTime: tasks.withTime.filter((t) => t.id !== task.id),
  };
}

export function addTaskWithTime(task: WithTime<LocalTask>, tasks: TasksForDay) {
  return {
    ...tasks,
    withTime: [...tasks.withTime, task],
  };
}

export function moveToTimed(task: WithTime<LocalTask>, tasks: TasksForDay) {
  const withRemoved = removeTask(task, tasks);
  return { ...withRemoved, withTime: [...withRemoved.withTime, task] };
}

export function getDayKey(day: Moment) {
  return day.format(DEFAULT_DAILY_NOTE_FORMAT);
}

export function moveTaskToDay(
  baseline: DayToTasks,
  task: WithTime<LocalTask>,
  day: Moment,
) {
  const sourceKey = getDayKey(task.startTime);
  const destKey = getDayKey(day);
  const source = baseline[sourceKey];
  const dest = baseline[destKey];

  const withUpdatedStartTime = {
    ...task,
    startTime: minutesToMomentOfDay(
      getMinutesSinceMidnight(task.startTime),
      day,
    ),
  };

  return {
    ...baseline,
    [sourceKey]: removeTask(withUpdatedStartTime, source),
    [destKey]: addTaskWithTime(withUpdatedStartTime, dest),
  };
}

export function moveTaskToColumn(
  day: Moment,
  task: WithTime<LocalTask>,
  baseline: DayToTasks,
) {
  if (day.isSame(task.startTime, "day")) {
    const key = getDayKey(task.startTime);

    return {
      ...baseline,
      [key]: moveToTimed(task, baseline[key]),
    };
  }

  return moveTaskToDay(baseline, task, day);
}

// todo: remove, replace with simple filter
function getEditableTasks(dayToTasks: DayToTasks) {
  const filteredEntries = Object.entries(dayToTasks).map(
    ([dayKey, tasks]) =>
      [
        dayKey,
        {
          noTime: tasks.noTime.filter(
            (task): task is LocalTask => !isRemote(task),
          ),
          withTime: tasks.withTime.filter(
            (task): task is WithTime<LocalTask> => !isRemote(task),
          ),
        },
      ] as const,
  );

  return Object.fromEntries<{
    withTime: WithTime<LocalTask>[];
    noTime: LocalTask[];
  }>(filteredEntries);
}

function getFlatTimeBlocks(dayToTasks: DayToTasks) {
  return Object.values(dayToTasks).flatMap(({ withTime, noTime }) => [
    ...withTime,
    ...noTime,
  ]);
}

export function hasDateFromProp(task: LocalTask) {
  return scheduledPropRegExps.some((regexp) => regexp.test(task.text));
}

export type Diff = {
  deleted?: Array<LocalTask>;
  updated?: Array<LocalTask>;
  created?: Array<LocalTask>;
};

export function getTaskDiffFromEditState(base: LocalTask[], next: LocalTask[]) {
  return next.map(updateTaskText).reduce<Omit<Required<Diff>, "deleted">>(
    (result, task) => {
      const thisTaskInBase = base.find((baseTask) => baseTask.id === task.id);

      if (!thisTaskInBase) {
        result.created.push(task);
      }

      if (
        thisTaskInBase &&
        (!thisTaskInBase.startTime.isSame(task.startTime) ||
          thisTaskInBase.durationMinutes !== task.durationMinutes)
      ) {
        result.updated.push(task);
      }

      return result;
    },
    {
      updated: [],
      created: [],
    },
  );
}

export function mapTaskDiffToUpdates(
  diff: Diff,
  settings: DayPlannerSettings,
): Update[] {
  return Object.entries(diff)
    .flatMap(([type, tasks]) => tasks.map((task) => ({ type, task })))
    .reduce<Update[]>((result, { type, task }) => {
      if (type === "created") {
        if (task.location) {
          return result.concat({
            type: "created",
            contents: task.text,
            path: task.location.path,
            target: task.location.position?.start?.line,
          });
        }

        return result.concat({
          type: "mdast",
          path: createDailyNotePath(task.startTime),
          updateFn: (root: Root) => {
            const taskRoot = fromMarkdown(task.text);
            const listItemToInsert = findFirst(taskRoot, checkListItem);

            isNotVoid(listItemToInsert);
            isListItem(listItemToInsert);

            return insertListItemUnderHeading(
              root,
              settings.plannerHeading,
              listItemToInsert,
            );
          },
        });
      }

      isNotVoid(task.location);

      const { path, position } = task.location;

      if (type === "deleted") {
        return result.concat({
          type: "deleted",
          path,
          range: position,
        });
      }

      const originalLocationDay = getDateFromPath(path, "day");
      const needToMoveBetweenNotes =
        originalLocationDay &&
        !task.startTime.isSame(originalLocationDay, "day");

      if (!needToMoveBetweenNotes) {
        return result.concat({
          type: "updated",
          path,
          range: { start: position.start, end: position.start },
          contents: getFirstLine(task.text),
        });
      }

      return result.concat(
        {
          type: "deleted",
          path,
          range: position,
        },
        {
          type: "mdast",
          // todo: duplication
          path: createDailyNotePath(task.startTime),
          updateFn: (root: Root) => {
            const taskRoot = fromMarkdown(task.text);
            const listItemToInsert = findFirst(taskRoot, checkListItem);

            isNotVoid(listItemToInsert);
            isListItem(listItemToInsert);

            return insertListItemUnderHeading(
              root,
              settings.plannerHeading,
              listItemToInsert,
            );
          },
        },
      );
    }, []);
}

export const mergeTasks = mergeWith((value, sourceValue) => {
  return Array.isArray(value) ? value.concat(sourceValue) : undefined;
});
