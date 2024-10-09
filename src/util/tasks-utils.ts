import { mergeWith } from "lodash/fp";
import type { Root } from "mdast";
import type { Moment } from "moment/moment";
import { normalizePath } from "obsidian";
import {
  DEFAULT_DAILY_NOTE_FORMAT,
  getDailyNoteSettings,
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
  type LocalTask,
  type Task,
  type TasksForDay,
  type WithTime,
  isRemote,
} from "../task-types";

import { getMinutesSinceMidnight, minutesToMomentOfDay } from "./moment";
import { getFirstLine, taskToString, updateTaskText } from "./task-utils";

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

function isOnSameDay(a: WithTime<Task>, b: WithTime<Task>) {
  return a.startTime.isSame(b.startTime, "day");
}

function isOnSameTime(a: WithTime<Task>, b: WithTime<Task>) {
  return a.startTime.isSame(b.startTime);
}

export type Diff = {
  deleted?: Array<LocalTask>;
  updated?: Array<LocalTask>;
  created?: Array<LocalTask>;
};

export function getTaskDiffFromEditState(base: DayToTasks, next: DayToTasks) {
  const editableBase = getEditableTasks(base);
  const editableNext = getEditableTasks(next);

  // todo: remove assertion
  const flatBase = getFlatTimeBlocks(editableBase) as Array<LocalTask>;
  const flatNext = (getFlatTimeBlocks(editableNext) as Array<LocalTask>).map(
    updateTaskText,
  );

  return flatNext.reduce<Required<Diff>>(
    (result, task) => {
      const thisTaskInBase = flatBase.find(
        (baseTask) => baseTask.id === task.id,
      );

      if (thisTaskInBase) {
        const needToMoveBetweenDailyNotes =
          !hasDateFromProp(task) && !isOnSameDay(thisTaskInBase, task);

        if (needToMoveBetweenDailyNotes) {
          result.deleted.push(task);
          result.created.push(task);
        } else if (!isOnSameTime(thisTaskInBase, task)) {
          result.updated.push(task);
        }
      } else {
        result.created.push(task);
      }

      return result;
    },
    {
      deleted: [],
      updated: [],
      created: [],
    },
  );
}

function createDailyNotePath(date: Moment) {
  const { format, folder } = getDailyNoteSettings();
  let filename = date.format(format);

  if (!filename.endsWith(".md")) {
    filename += ".md";
  }

  return normalizePath(`${folder}/${filename}`);
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

        // todo: do not spread this logic all over functions
        return result.concat({
          type: "mdast",
          path: createDailyNotePath(task.startTime),
          updateFn: (root: Root) => {
            const taskRoot = fromMarkdown(task.text);
            const listItem = findFirst(taskRoot, checkListItem);

            isNotVoid(listItem);
            isListItem(listItem);

            return insertListItemUnderHeading(
              root,
              settings.plannerHeading,
              listItem,
            );
          },
        });
      }

      if (!task.location) {
        throw new Error(`Can't update a task without location: ${task.text}`);
      }

      const { path, position } = task.location;

      if (type === "deleted") {
        return result.concat({
          type: "deleted",
          path,
          range: position,
        });
      }

      return result.concat({
        type: "updated",
        path,
        range: { start: position.start, end: position.start },
        contents: getFirstLine(taskToString(task)),
      });
    }, []);
}

export const mergeTasks = mergeWith((value, sourceValue) => {
  return Array.isArray(value) ? value.concat(sourceValue) : undefined;
});
