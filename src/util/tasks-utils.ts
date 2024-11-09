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
import type { Update } from "../service/diff-writer";
import type { DayPlannerSettings } from "../settings";
import { type LocalTask } from "../task-types";
import { EditMode } from "../ui/hooks/use-edit/types";

import { createDailyNotePath } from "./daily-notes";
import * as t from "./task-utils";

export function getEmptyRecordsForDay() {
  return { withTime: [], noTime: [] };
}

export function getDayKey(day: Moment) {
  return day.format(DEFAULT_DAILY_NOTE_FORMAT);
}

export type Diff = {
  deleted?: Array<LocalTask>;
  updated?: Array<LocalTask>;
  created?: Array<LocalTask>;
};

export function getTaskDiffFromEditState(base: LocalTask[], next: LocalTask[]) {
  return next.reduce<Omit<Required<Diff>, "deleted">>(
    (result, task) => {
      const thisTaskInBase = base.find((baseTask) => baseTask.id === task.id);

      if (!thisTaskInBase) {
        result.created.push(task);
      }

      if (thisTaskInBase && !t.isTimeEqual(thisTaskInBase, task)) {
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
  mode: EditMode,
  settings: DayPlannerSettings,
): Update[] {
  return Object.entries(diff)
    .flatMap(([type, tasks]) => tasks.map((task) => ({ type, task })))
    .reduce<Update[]>((result, { type, task }) => {
      const taskText = t.toString(task, mode);

      // todo: move out to a function
      if (type === "created") {
        if (task.location) {
          // todo: every test should have an operation
          if (mode === EditMode.SCHEDULE_SEARCH_RESULT) {
            return result.concat({
              type: "updated",
              path: task.location.path,
              range: {
                start: task.location.position.start,
                end: task.location.position.start,
              },
              contents: t.getFirstLine(taskText),
            });
          }

          return result.concat({
            type: "created",
            contents: taskText,
            path: task.location.path,
            target: task.location.position?.start?.line,
          });
        }

        return result.concat({
          type: "mdast",
          path: createDailyNotePath(task.startTime),
          updateFn: (root: Root) => {
            const taskRoot = fromMarkdown(taskText);
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
          contents: t.getFirstLine(taskText),
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
            const taskRoot = fromMarkdown(taskText);
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
