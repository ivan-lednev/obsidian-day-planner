import { isNotVoid } from "typed-assert";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { strictParse } from "../../util/moment";
import { clamp } from "../../util/task-utils";
import { createAppSelector } from "../create-app-selector";

import {
  type LogEntry,
  selectLogEntriesByDay,
  selectLogEntriesById,
} from "./tracker-slice";

// todo: this is misleading, it works only for a single day, and it should
export const selectLogEntriesForDayKeys = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    (state, dayKeys: string[]) => dayKeys,
  ],
  (byDay, byId, dayKeys) => {
    // todo: clean up
    const firstDay = dayKeys[0];

    isNotVoid(firstDay);

    const parsedFirstDay = strictParse(firstDay);
    const startOfDay = parsedFirstDay.clone().startOf("day");
    const endOfDay = parsedFirstDay.clone().endOf("day");

    const uniqueLogEntryKeys = new Set(
      dayKeys.flatMap((dayKey) => byDay[dayKey] || []),
    );

    const inflatedTimeBlocksWithoutActiveClocks = [...uniqueLogEntryKeys]
      .map((logEntryKey) => byId[logEntryKey])
      .filter((logEntry): logEntry is LogEntry & { end: string } =>
        Boolean(logEntry.end),
      )
      .map((logEntry) => {
        const parsedStart = strictParse(logEntry.start);
        const parsedEnd = strictParse(logEntry.end);

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
