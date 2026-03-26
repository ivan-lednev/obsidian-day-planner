import { type PayloadAction } from "@reduxjs/toolkit";
import type { CachedMetadata, MetadataCache, Pos, Vault } from "obsidian";
import { isNotVoid } from "typed-assert";

import { defaultDayFormat } from "../../constants";
import type { ListPropsParser } from "../../service/list-props-parser";
import { getDaysInRange, strictParse } from "../../util/moment";
import { createAppSlice } from "../create-app-slice";
import type { AppListenerEffect } from "../store";

interface TaskEntry {
  id: string;
  text: string;
  position: Pos;
  path: string;
  logEntries?: string[];
}

export interface LogEntry {
  start: string;
  end?: string;
  parent: string;
  dayKeys: string[];
  id: string;
  text: string;
}

interface IndexSliceState {
  taskEntries: {
    byId: Record<string, TaskEntry>;
    byPath: Record<string, string[]>;
  };
  logEntries: {
    byId: Record<string, LogEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, string[]>;
  };
}

const initialState: IndexSliceState = {
  taskEntries: { byPath: {}, byId: {} },
  logEntries: {
    byPath: {},
    byId: {},
    byDay: {},
  },
};

interface IndexRequestedPayload {
  path: string;
  contents: string;
  cache: CachedMetadata;
}

interface FileMetadataProcessedPayload {
  path: string;
  taskEntries?: TaskEntry[];
  logEntries?: LogEntry[];
}

interface FileDeletedPayload {
  path: string;
}

export const trackerSlice = createAppSlice({
  name: "tracker",
  initialState,
  reducers: (create) => ({
    indexRequested: create.reducer(
      (state, action: PayloadAction<IndexRequestedPayload>) => {},
    ),
    fileDeleted: create.reducer(
      (state, action: PayloadAction<FileDeletedPayload>) => {
        const { path } = action.payload;

        const taskEntryIds = state.taskEntries.byPath[path] || [];

        taskEntryIds.forEach((id) => {
          delete state.taskEntries.byId[id];
        });

        delete state.taskEntries.byPath[path];

        // todo: copypasted
        const logEntryIds = state.logEntries.byPath[path] || [];

        logEntryIds.forEach((id) => {
          const logEntry = state.logEntries.byId[id];

          isNotVoid(logEntry, "Inconsistent store state");

          logEntry.dayKeys.forEach((dayKey) => {
            isNotVoid(
              state.logEntries.byDay[dayKey],
              "Inconsistent store state",
            );

            state.logEntries.byDay[dayKey] = state.logEntries.byDay[
              dayKey
            ].filter((it) => it !== id);
          });
        });

        logEntryIds.forEach((id) => {
          delete state.logEntries.byId[id];
        });

        delete state.logEntries.byPath[path];
      },
    ),
    fileMetadataProcessed: create.reducer(
      (state, action: PayloadAction<FileMetadataProcessedPayload>) => {
        const { path, taskEntries = [], logEntries = [] } = action.payload;

        // todo: repeat for logEntries
        const previousTaskEntryIds = state.taskEntries.byPath[path] || [];

        previousTaskEntryIds.forEach((id) => {
          delete state.taskEntries.byId[id];
        });

        // todo: copy pasta
        state.taskEntries.byPath[path] = taskEntries.map((it) => it.id);

        taskEntries.forEach((it) => {
          state.taskEntries.byId[it.id] = it;
        });

        const previousLogEntryIds = state.logEntries.byPath[path] || [];

        previousLogEntryIds.forEach((id) => {
          const logEntry = state.logEntries.byId[id];

          isNotVoid(logEntry, "Inconsistent store state");

          logEntry.dayKeys.forEach((dayKey) => {
            isNotVoid(
              state.logEntries.byDay[dayKey],
              "Inconsistent store state",
            );

            state.logEntries.byDay[dayKey] = state.logEntries.byDay[
              dayKey
            ].filter((it) => it !== id);
          });
        });

        previousLogEntryIds.forEach((id) => {
          delete state.logEntries.byId[id];
        });

        // todo: copy pasta
        state.logEntries.byPath[path] = logEntries.map((it) => it.id);

        logEntries.forEach((it) => {
          state.logEntries.byId[it.id] = it;
        });

        logEntries.forEach((logEntry) => {
          logEntry.dayKeys.forEach((dayKey) => {
            (state.logEntries.byDay[dayKey] ??= []).push(logEntry.id);
          });
        });
      },
    ),
  }),
  selectors: {
    selectEntriesForPath: (state, path) => {
      return state.taskEntries.byPath[path]?.map(
        (it) => state.taskEntries.byId[it],
      );
    },
    selectActiveClocks: (state) =>
      Object.values(state.logEntries.byId)
        .flat()
        .filter((it) => !it.end)
        .map((logEntry) => {
          const taskEntry = state.taskEntries.byId[logEntry.parent];

          isNotVoid(taskEntry, "Inconsistent store state");

          return logEntryToLocalTask(logEntry, taskEntry);
        }),
    selectLogEntriesByDay: (state) => state.logEntries.byDay,
    selectLogEntriesById: (state) => state.logEntries.byId,
  },
});

function logEntryToLocalTask(logEntry: LogEntry, taskEntry: TaskEntry) {
  return {
    text: taskEntry.text,
    location: { path: taskEntry.path, position: taskEntry.position },
    symbol: "-",
    startTime: strictParse(logEntry.start),
    durationMinutes: 30,
    id: logEntry.id,
  };
}

export const { fileMetadataProcessed, indexRequested, fileDeleted } =
  trackerSlice.actions;

export const {
  selectEntriesForPath,
  selectActiveClocks,
  selectLogEntriesByDay,
  selectLogEntriesById,
} = trackerSlice.selectors;

type IndexRequested = ReturnType<typeof indexRequested>;

const idSeparator = "::";

export function createId(...args: (string | number)[]) {
  return args.join(idSeparator);
}

export function createIndexListener(props: {
  listPropsParser: ListPropsParser;
  vault: Vault;
  metadataCache: MetadataCache;
}): AppListenerEffect<IndexRequested> {
  const { listPropsParser } = props;

  return async (action, listenerApi) => {
    const { path, cache, contents } = action.payload;

    const tasks = cache.listItems?.filter((it) => it.task !== undefined);

    const taskEntries = tasks?.map((task) => {
      const listItemText = contents.slice(
        task.position.start.offset,
        task.position.end.offset,
      );
      const listItemLines = listItemText.split("\n");
      const firstLine = listItemLines[0];

      isNotVoid(firstLine, "The first line of any list cannot be empty");

      const listItemProps = listPropsParser.getListPropsFromListItem(
        task,
        listItemText,
      );
      const taskEntryId = createId(path, task.position.start.line);

      const logEntries = listItemProps?.parsed.planner?.log?.map(
        (it, index) => {
          const { start, end } = it;

          const parsedStart = window.moment(
            start,
            window.moment.ISO_8601,
            true,
          );
          const parsedEnd = end
            ? // todo: replace with util
              window.moment(end, window.moment.ISO_8601, true)
            : // TODO: bug source
              //  Solution 1: dispatch dayChanged() and update active clocks then; simple & works
              //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveClocks selector
              //  Solution 3: use sorted array instead of buckets
              window.moment();

          const dayKeys: string[] = getDaysInRange(parsedStart, parsedEnd).map(
            (day) => day.format(defaultDayFormat),
          );

          return {
            ...it,
            parent: taskEntryId,
            dayKeys,
            id: createId(taskEntryId, index),
            text: firstLine,
          };
        },
      );

      return {
        id: taskEntryId,
        text: firstLine,
        position: task.position,
        path,
        logEntries,
      };
    });

    listenerApi.dispatch(
      fileMetadataProcessed({
        path,
        taskEntries: taskEntries?.map(({ logEntries, ...rest }) => ({
          logEntries: logEntries?.map((it) => it.id),
          ...rest,
        })),
        logEntries: taskEntries?.flatMap((it) => it.logEntries || []),
      }),
    );
  };
}
