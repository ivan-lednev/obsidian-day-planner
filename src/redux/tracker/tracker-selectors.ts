import { selectLogEntriesByDay, selectLogEntriesById } from "./tracker-slice";
import { createAppSelector } from "../create-app-selector";

export const selectLogEntriesForDayKeys = createAppSelector(
  [
    selectLogEntriesByDay,
    selectLogEntriesById,
    (state, dayKeys: string[]) => dayKeys,
  ],
  (byDay, byId, dayKeys) => {
    const uniqueLogEntryKeys = new Set(
      dayKeys.flatMap((dayKey) => byDay[dayKey] || []),
    );

    return [...uniqueLogEntryKeys].map((logEntryKey) => byId[logEntryKey]);
  },
);
