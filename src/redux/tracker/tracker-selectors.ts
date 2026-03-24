import type { Moment } from "moment";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { strictParse } from "../../util/moment";
import { clamp } from "../../util/task-utils";
import { createAppSelector } from "../create-app-selector";

import { selectLogEntriesByDay, selectLogEntriesById } from "./tracker-slice";
import { isNotVoid } from "typed-assert";

export const selectLogEntriesForDay = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    (state, dayKey: string) => dayKey,
    (state, dayKey, currentTime: Moment) => currentTime,
  ],
  (byDay, byId, dayKey, currentTime) => {
    const parsedDay = strictParse(dayKey);
    const startOfDay = parsedDay.clone().startOf("day");
    const endOfDay = parsedDay.clone().endOf("day");
    const isDayKeyForToday = parsedDay.isSame(currentTime, "day");

    const uniqueLogEntryKeys = [...new Set(byDay[dayKey])];

    const inflatedTimeBlocksWithoutActiveClocks = uniqueLogEntryKeys.map(
      (logEntryKey) => {
        const logEntry = byId[logEntryKey];

        isNotVoid(
          logEntry,
          `Inconsistent store state: expected to find log entry by id ${logEntryKey}`,
        );

        const parsedStart = strictParse(logEntry.start);
        const parsedEnd = logEntry.end
          ? strictParse(logEntry.end)
          : currentTime;
        const isActiveLogRecordForToday = isDayKeyForToday && !logEntry.end;

        // todo: use adapter: logEntryToLocalTask
        const timeBlock = {
          id: logEntry.id,
          text: logEntry.text,
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
