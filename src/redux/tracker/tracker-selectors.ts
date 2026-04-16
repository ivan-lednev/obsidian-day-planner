import type { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import { addHorizontalPlacing } from "../../overlap/overlap";
import type { LocalTask } from "../../task-types";
import { strictParse } from "../../util/moment";
import { clamp, getDayKey } from "../../util/task-utils";
import { createAppSelector } from "../create-app-selector";
import { selectVisibleDays } from "../global-slice";

import {
  type ListItemEntry,
  type ListItemEntryWithChildren,
  planEntryToLocalTask,
  selectLogEntriesByDay,
  selectLogEntriesById,
  selectPlanEntriesByDay,
  selectPlanEntriesById,
  selectTaskEntriesById,
} from "./tracker-slice";
import type { LogEntry } from "./tracker-slice";

export const selectLogEntriesForDay = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    selectTaskEntriesById,
    (state, dayKey: string) => dayKey,
    (state, dayKey, currentTime: Moment) => currentTime,
  ],
  (byDay, byId, taskEntriesById, dayKey, currentTime) => {
    const parsedDay = strictParse(dayKey);
    const startOfDay = parsedDay.clone().startOf("day");
    const endOfDay = parsedDay.clone().endOf("day");
    const isDayKeyForToday = parsedDay.isSame(currentTime, "day");

    // todo: remove set
    const uniqueLogEntryIds = [...new Set(Object.keys(byDay[dayKey] || {}))];

    const inflatedTimeBlocksWithoutActiveClocks = uniqueLogEntryIds.map(
      (logEntryId) => {
        const logEntry = byId[logEntryId];

        isNotVoid(
          logEntry,
          `Inconsistent store state: expected to find log entry by id ${logEntryId}`,
        );

        const taskEntry = taskEntriesById[logEntry.parent];

        isNotVoid(
          taskEntry,
          `Inconsistent store state: task entry not found for ID: ${logEntryId}`,
        );

        const parsedStart = strictParse(logEntry.start);
        const parsedEnd = logEntry.end
          ? strictParse(logEntry.end)
          : currentTime;
        const isActiveLogRecordForToday = isDayKeyForToday && !logEntry.end;

        // todo: use adapter: logEntryToLocalTask
        const timeBlock: LocalTask = {
          id: logEntry.id,
          text: taskEntry.text,
          startTime: parsedStart,
          status: taskEntry.task,
          symbol: "-",
          durationMinutes: parsedEnd.diff(parsedStart, "minutes"),
          ...(isActiveLogRecordForToday
            ? { truncated: ["bottom" as const] }
            : {}),
        };

        return clamp(timeBlock, startOfDay, endOfDay);
      },
    );

    return addHorizontalPlacing(inflatedTimeBlocksWithoutActiveClocks);
  },
);

export const selectRecentLogEntries = createAppSelector(
  [
    // todo: use pre-defined ones
    (state) => state.tracker.logEntries.byId,
    (state) => state.tracker.taskEntries.byId,
  ],
  (logEntriesById, taskEntriesById) => {
    const taskEntryIdToLatestLogRecord = Object.values(logEntriesById)
      .flat()
      .filter((it): it is LogEntry & { end: string } => it.end !== undefined)
      .toSorted((a, b) => Date.parse(b.end) - Date.parse(a.end))
      .reduce<Map<string, LogEntry>>((result, logEntry) => {
        if (result.has(logEntry.parent)) {
          return result;
        }

        return result.set(logEntry.parent, logEntry);
      }, new Map());

    return [...taskEntryIdToLatestLogRecord].map(([taskEntryId, logEntry]) => {
      const taskEntry = taskEntriesById[taskEntryId];

      isNotVoid(taskEntry, "Inconsistent store state");

      return planEntryToLocalTask(logEntry, taskEntry);
    });
  },
);

export const selectPlanEntriesForVisibleDays = createAppSelector(
  [
    selectPlanEntriesByDay,
    selectPlanEntriesById,
    selectTaskEntriesById,
    selectVisibleDays,
  ],
  // todo: copy-pasta. Can we re-use it without breaking caching?
  (planEntriesByDay, planEntriesById, listItemEntriesById, dayKeysFull) => {
    const uniqueTaskIds = new Set(
      dayKeysFull
        // todo: do not store full timestamp in store
        .map((key) => getDayKey(strictParse(key)))
        .flatMap((dayKey) => Object.keys(planEntriesByDay[dayKey] || {})),
    );

    return (
      [...uniqueTaskIds]?.map((id) => {
        const planEntry = planEntriesById[id];

        isNotVoid(planEntry, "Inconsistent index state");

        const listItemEntry = listItemEntriesById[planEntry.parent];

        isNotVoid(listItemEntry, "Inconsistent index state");

        const withChildren = inflateChildren(
          listItemEntry,
          listItemEntriesById,
        );

        return planEntryToLocalTask(planEntry, listItemEntry, withChildren);
      }) || []
    );
  },
);

export const selectPlanEntriesForDays = createAppSelector(
  [
    selectPlanEntriesByDay,
    selectPlanEntriesById,
    selectTaskEntriesById,
    (state, dayKeys: string[]) => dayKeys,
  ],
  (planEntriesByDay, planEntriesById, listItemEntriesById, dayKeys) => {
    const uniqueListItemIds = new Set(
      dayKeys.flatMap((dayKey) => Object.keys(planEntriesByDay[dayKey] || {})),
    );

    return (
      [...uniqueListItemIds]?.map((id) => {
        const planEntry = planEntriesById[id];

        isNotVoid(planEntry, "Inconsistent index state");

        const listItemEntry = listItemEntriesById[planEntry.parent];

        isNotVoid(listItemEntry, "Inconsistent index state");

        const withChildren = inflateChildren(
          listItemEntry,
          listItemEntriesById,
        );

        return planEntryToLocalTask(planEntry, listItemEntry, withChildren);
      }) || []
    );
  },
);

// todo: we do this 3 times in different places
function inflateChildren(
  listItemEntry: ListItemEntry,
  listItemEntriesById: Record<string, ListItemEntry>,
): ListItemEntryWithChildren {
  const { children = [], ...rest } = listItemEntry;

  return {
    ...rest,
    // todo: not needed here
    logEntries: [],
    planEntries: [],
    children: children.map((id) => {
      const child = listItemEntriesById[id];

      isNotVoid(child, "Inconsistent index state");

      return inflateChildren(child, listItemEntriesById);
    }),
  };
}
