import type { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { strictParse } from "../../util/moment";
import { clamp } from "../../util/task-utils";
import { createAppSelector } from "../create-app-selector";

import {
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
        const timeBlock = {
          id: logEntry.id,
          text: taskEntry.text,
          startTime: parsedStart,
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

export const selectRecentClocks = createAppSelector(
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

export const selectPlanEntriesForDay = createAppSelector(
  [
    selectPlanEntriesByDay,
    selectPlanEntriesById,
    selectTaskEntriesById,
    (state, dayKey) => dayKey,
  ],
  (planEntriesByDay, planEntriesById, taskEntriesById, dayKey) => {
    const ids = Object.keys(planEntriesByDay[dayKey]);

    return (
      ids?.map((id) => {
        const planEntry = planEntriesById[id];

        isNotVoid(planEntry, "Inconsistent index state");

        const taskEntry = taskEntriesById[planEntry.parent];

        isNotVoid(taskEntry, "Inconsistent index state");

        return planEntryToLocalTask(planEntry, taskEntry);
      }) || []
    );
  },
);
