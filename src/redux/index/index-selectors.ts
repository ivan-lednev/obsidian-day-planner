import type { Moment } from "moment";
import { isNotVoid } from "typed-assert";

import { addHorizontalPlacing } from "../../overlap/overlap";
import type { LogTimeBlock } from "../../time-block-types";
import { strictParse } from "../../util/moment";
import { clamp, getDayKey } from "../../util/time-block-utils";
import { createAppSelector } from "../create-app-selector";
import { selectVisibleDays } from "../global-slice";

import {
  isListItemEntry,
  type FileSystemEntry,
  type ListItemEntry,
  type ListItemEntryWithChildren,
  entryToTimeBlock,
  selectFileEntriesById,
  selectLogEntriesByDay,
  selectLogEntriesById,
  selectPlanEntriesByDay,
  selectPlanEntriesById,
  selectTaskEntriesById,
  type ClosedLogEntry,
} from "./index-slice";

export const selectLogEntriesForDay = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    selectTaskEntriesById,
    selectFileEntriesById,
    (state, dayKey: string) => dayKey,
    (state, dayKey, currentTime: Moment) => currentTime,
  ],
  (byDay, byId, taskEntriesById, fileEntriesById, dayKey, currentTime) => {
    const parsedDay = strictParse(dayKey);
    const startOfDay = parsedDay.clone().startOf("day");
    const endOfDay = parsedDay.clone().endOf("day");
    const isDayKeyForToday = parsedDay.isSame(currentTime, "day");

    const uniqueLogEntryIds = Object.keys(byDay[dayKey] || {});

    const inflatedTimeBlocksWithoutActiveClocks = uniqueLogEntryIds.map(
      (logEntryId) => {
        const logEntry = byId[logEntryId];

        isNotVoid(
          logEntry,
          `Inconsistent store state: expected to find log entry by id ${logEntryId}`,
        );

        // todo: remove once we have noUncheckedIndexedAccess
        //  the state types are imprecise: lookups by id may return
        //  undefined, so the union has to be spelled out for narrowing to work
        const entry: ListItemEntry | FileSystemEntry | undefined =
          taskEntriesById[logEntry.parentId] ??
          fileEntriesById[logEntry.parentId];

        isNotVoid(
          entry,
          `Inconsistent store state: task entry not found for ID: ${logEntryId}`,
        );

        const parsedStart = strictParse(logEntry.start);
        const parsedEnd = logEntry.end
          ? strictParse(logEntry.end)
          : currentTime;
        const isActiveLogRecordForToday = isDayKeyForToday && !logEntry.end;

        // todo: use adapter: logEntryToLocalTask
        const base = {
          id: logEntry.id,
          text: entry.text,
          startTime: parsedStart,
          symbol: "-",
          durationMinutes: parsedEnd.diff(parsedStart, "minutes"),
          ...(isActiveLogRecordForToday
            ? { truncated: ["bottom" as const] }
            : {}),
        };

        let timeBlock: LogTimeBlock;

        if (isListItemEntry(entry)) {
          if (logEntry.source === "frontmatterLog") {
            throw new Error(
              "Inconsistent store state: a frontmatter log entry cannot be attached to a list item",
            );
          }

          timeBlock = {
            ...base,
            source: logEntry.source,
            status: entry.task,
            path: entry.path,
            position: entry.position,
          };
        } else {
          if (logEntry.source !== "frontmatterLog") {
            throw new Error(
              "Inconsistent store state: only frontmatter log entries can be attached to file entries",
            );
          }

          timeBlock = {
            ...base,
            source: logEntry.source,
            path: entry.path,
          };
        }

        return clamp(timeBlock, startOfDay, endOfDay);
      },
    );

    return addHorizontalPlacing(inflatedTimeBlocksWithoutActiveClocks);
  },
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

export const selectRecentLogEntries = createAppSelector(
  [
    selectLatestClosedLogEntryByParentId,
    selectTaskEntriesById,
    selectFileEntriesById,
  ],
  (latestClosedLogEntryByParentId, taskEntriesById, fileEntriesById) => {
    return [...latestClosedLogEntryByParentId].map(
      ([taskEntryId, logEntry]) => {
        const entry =
          taskEntriesById[taskEntryId] ?? fileEntriesById[taskEntryId];

        isNotVoid(entry, "Inconsistent store state");

        return entryToTimeBlock(logEntry, entry);
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

        const listItemEntry = listItemEntriesById[planEntry.parentId];

        isNotVoid(listItemEntry, "Inconsistent index state");

        const withChildren = inflateChildren(
          listItemEntry,
          listItemEntriesById,
        );

        return entryToTimeBlock(planEntry, listItemEntry, withChildren);
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

        const listItemEntry = listItemEntriesById[planEntry.parentId];

        isNotVoid(listItemEntry, "Inconsistent index state");

        const withChildren = inflateChildren(
          listItemEntry,
          listItemEntriesById,
        );

        return entryToTimeBlock(planEntry, listItemEntry, withChildren);
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
