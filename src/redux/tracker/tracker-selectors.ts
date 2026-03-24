import type { Moment } from "moment";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { strictParse } from "../../util/moment";
import { clamp } from "../../util/task-utils";
import { createAppSelector } from "../create-app-selector";

import { selectLogEntriesByDay, selectLogEntriesById } from "./tracker-slice";

export const selectLogEntriesForDay = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    (state, dayKey: string) => dayKey,
    (state, dayKey, currentTime: Moment) => currentTime,
  ],
  (byDay, byId, dayKey, currentTime) => {
    const parsedFirstDay = strictParse(dayKey);
    const startOfDay = parsedFirstDay.clone().startOf("day");
    const endOfDay = parsedFirstDay.clone().endOf("day");

    const uniqueLogEntryKeys = [...new Set(byDay[dayKey])];

    const inflatedTimeBlocksWithoutActiveClocks = uniqueLogEntryKeys
      .map((logEntryKey) => byId[logEntryKey])
      .map((logEntry) => {
        const parsedStart = strictParse(logEntry.start);
        const parsedEnd = logEntry.end
          ? strictParse(logEntry.end)
          : currentTime;

        // todo: use adapter: logEntryToLocalTask
        const timeBlock = {
          ...logEntry,
          startTime: parsedStart,
          symbol: "-",
          durationMinutes: parsedEnd.diff(parsedStart, "minutes"),
        };

        return clamp(timeBlock, startOfDay, endOfDay);
      });

    return addHorizontalPlacing(inflatedTimeBlocksWithoutActiveClocks);
  },
);
