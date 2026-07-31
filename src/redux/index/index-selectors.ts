import type { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import { addHorizontalPlacing } from "../../overlap/overlap";
import type { LogTimeBlock } from "../../time-block-types";
import { strictParse, toMinutePrecision } from "../../util/moment";
import { clampToTimeRange } from "../../util/time-block-utils";
import { createAppSelector } from "../create-app-selector";
import { selectVisibleDays } from "../date-ranges-slice";

import {
  closedLogEntryToTimeBlock,
  logEntryToTimeBlock,
  planEntryToTimeBlock,
} from "./entry-to-time-block";
import {
  type ListItemEntry,
  type ListItemEntryWithChildren,
  selectFileEntriesById,
  selectLogEntriesByDay,
  selectLogEntriesById,
  selectPlanEntriesByDay,
  selectPlanEntriesById,
  selectListItemEntriesById,
  type ClosedLogEntry,
} from "./index-slice";

export const selectLogTimeBlocksForDay = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    selectListItemEntriesById,
    selectFileEntriesById,
    (state, dayKey: string) => dayKey,
    (state, dayKey, currentTime: Moment) => currentTime,
  ],
  (byDay, byId, listItemEntriesById, fileEntriesById, dayKey, currentTime) => {
    const parsedDay = strictParse(dayKey);
    const startOfDay = parsedDay.clone().startOf("day");
    const endOfDay = toMinutePrecision(parsedDay.clone().endOf("day"));
    const isDayKeyForToday = parsedDay.isSame(currentTime, "day");

    const uniqueLogEntryIds = Object.keys(byDay[dayKey] || {});

    const inflatedTimeBlocksWithoutActiveClocks = uniqueLogEntryIds.map(
      (logEntryId) => {
        const logEntry = byId[logEntryId];

        isNotVoid(
          logEntry,
          `Inconsistent store state: expected to find log entry by id ${logEntryId}`,
        );

        const entry =
          listItemEntriesById[logEntry.parentId] ??
          fileEntriesById[logEntry.parentId];

        isNotVoid(
          entry,
          `Inconsistent store state: parent entry not found for log entry ${logEntryId}`,
        );

        const timeBlock = logEntryToTimeBlock({
          logEntry,
          parentEntry: entry,
          currentTime,
        });

        const clamped = clampToTimeRange(timeBlock, {
          start: startOfDay,
          end: endOfDay,
        });

        return timeBlock.isRunning && isDayKeyForToday
          ? { ...clamped, truncated: ["bottom" as const] }
          : clamped;
      },
    );

    return addHorizontalPlacing(inflatedTimeBlocksWithoutActiveClocks);
  },
);

const selectOpenLogEntries = createAppSelector(
  [selectLogEntriesById],
  (logEntriesById) => Object.values(logEntriesById).filter((it) => !it.end),
);

const emptyActiveLogTimeBlocks: LogTimeBlock[] = [];

export const selectActiveLogTimeBlocks = createAppSelector(
  [
    selectOpenLogEntries,
    selectListItemEntriesById,
    selectFileEntriesById,
    (state, currentTime: Moment) => toMinutePrecision(currentTime).valueOf(),
  ],
  (openLogEntries, listItemEntriesById, fileEntriesById, minuteTimestamp) => {
    if (openLogEntries.length === 0) {
      return emptyActiveLogTimeBlocks;
    }

    const currentTime = window.moment(minuteTimestamp);

    return openLogEntries.map((logEntry) => {
      const entry =
        listItemEntriesById[logEntry.parentId] ??
        fileEntriesById[logEntry.parentId];

      isNotVoid(entry, "Inconsistent store state");

      return logEntryToTimeBlock({
        logEntry,
        parentEntry: entry,
        currentTime,
      });
    });
  },
);

export const selectNewestActiveLogTimeBlock = createAppSelector(
  [selectActiveLogTimeBlocks],
  (activeLogTimeBlocks) =>
    activeLogTimeBlocks.toSorted((a, b) => b.startTime.diff(a.startTime)).at(0),
);

const selectLatestClosedLogEntryByParentId = createAppSelector(
  [selectLogEntriesById],
  (logEntriesById) => {
    return Object.values(logEntriesById)
      .filter((it): it is ClosedLogEntry => it.end !== undefined)
      .toSorted((a, b) => Date.parse(b.end) - Date.parse(a.end))
      .reduce<Map<string, ClosedLogEntry>>((result, logEntry) => {
        if (result.has(logEntry.parentId)) {
          return result;
        }

        return result.set(logEntry.parentId, logEntry);
      }, new Map());
  },
);

export const selectRecentLogTimeBlocks = createAppSelector(
  [
    selectLatestClosedLogEntryByParentId,
    selectListItemEntriesById,
    selectFileEntriesById,
  ],
  (latestClosedLogEntryByParentId, listItemEntriesById, fileEntriesById) => {
    return [...latestClosedLogEntryByParentId].map(
      ([listItemEntryId, logEntry]) => {
        const entry =
          listItemEntriesById[listItemEntryId] ??
          fileEntriesById[listItemEntryId];

        isNotVoid(entry, "Inconsistent store state");

        // todo: filter out active clocks
        return closedLogEntryToTimeBlock({ logEntry, parentEntry: entry });
      },
    );
  },
);

export const selectLatestClosedLogEndByParentId = createAppSelector(
  [selectLatestClosedLogEntryByParentId],
  (latestClosedLogEntryByParentId) => {
    return [...latestClosedLogEntryByParentId].reduce<Map<string, number>>(
      (result, [parentId, logEntry]) =>
        result.set(parentId, Date.parse(logEntry.end)),
      new Map(),
    );
  },
);

export const selectPlanTimeBlocksForVisibleDays = createAppSelector(
  [
    selectPlanEntriesByDay,
    selectPlanEntriesById,
    selectListItemEntriesById,
    selectVisibleDays,
  ],
  // todo: copy-pasta. Can we re-use it without breaking caching?
  (planEntriesByDay, planEntriesById, listItemEntriesById, dayKeys) => {
    const uniquePlanEntryIds = new Set(
      dayKeys.flatMap((dayKey) => Object.keys(planEntriesByDay[dayKey] || {})),
    );

    return (
      [...uniquePlanEntryIds]?.map((id) => {
        const planEntry = planEntriesById[id];

        isNotVoid(planEntry, "Inconsistent index state");

        const listItemEntry = listItemEntriesById[planEntry.parentId];

        isNotVoid(listItemEntry, "Inconsistent index state");

        const withChildren = inflateChildren(
          listItemEntry,
          listItemEntriesById,
        );

        return planEntryToTimeBlock({
          planEntry,
          parentEntry: listItemEntry,
          listItemEntryWithChildren: withChildren,
        });
      }) || []
    );
  },
);

export const selectPlanTimeBlocksForDays = createAppSelector(
  [
    selectPlanEntriesByDay,
    selectPlanEntriesById,
    selectListItemEntriesById,
    (state, dayKeys: string[]) => dayKeys,
  ],
  (planEntriesByDay, planEntriesById, listItemEntriesById, dayKeys) => {
    const uniquePlanEntryIds = new Set(
      dayKeys.flatMap((dayKey) => Object.keys(planEntriesByDay[dayKey] || {})),
    );

    return (
      [...uniquePlanEntryIds]?.map((id) => {
        const planEntry = planEntriesById[id];

        isNotVoid(planEntry, "Inconsistent index state");

        const listItemEntry = listItemEntriesById[planEntry.parentId];

        isNotVoid(listItemEntry, "Inconsistent index state");

        const withChildren = inflateChildren(
          listItemEntry,
          listItemEntriesById,
        );

        return planEntryToTimeBlock({
          planEntry,
          parentEntry: listItemEntry,
          listItemEntryWithChildren: withChildren,
        });
      }) || []
    );
  },
);

// todo: we do this 3 times in different places
function inflateChildren(
  listItemEntry: ListItemEntry,
  listItemEntriesById: Record<string, ListItemEntry>,
): ListItemEntryWithChildren {
  const { childIds = [], ...rest } = listItemEntry;

  return {
    ...rest,
    // todo: not needed here
    logEntries: [],
    planEntries: [],
    children: childIds.map((id) => {
      const child = listItemEntriesById[id];

      isNotVoid(child, "Inconsistent index state");

      return inflateChildren(child, listItemEntriesById);
    }),
  };
}
