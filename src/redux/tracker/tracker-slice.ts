import { type PayloadAction } from "@reduxjs/toolkit";
import type { ListItemCache, MetadataCache, Pos, Vault } from "obsidian";
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

interface FileIndex {
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
      (state, action: PayloadAction<string[]>) => {},
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
    filesIndexed: create.reducer(
      (state, action: PayloadAction<FileIndex[]>) => {
        const fileIndexes = action.payload;

        fileIndexes.forEach((fileIndex) => {
          const { path, taskEntries = [], logEntries = [] } = fileIndex;

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

export const { filesIndexed, indexRequested, fileDeleted } =
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

type TaskCache = ListItemCache & { task: string };

function isTaskCache(listItemCache: ListItemCache): listItemCache is TaskCache {
  return listItemCache.task !== undefined;
}

export function createIndexListener(props: {
  listPropsParser: ListPropsParser;
  vault: Vault;
  metadataCache: MetadataCache;
}): AppListenerEffect<IndexRequested> {
  const { listPropsParser, metadataCache, vault } = props;

  function getDenormalizedEntries(
    tasks: Array<TaskCache>,
    contents: string,
    path: string,
  ) {
    return tasks.map((task) => {
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
        (rawLogEntry, index) => {
          const { start, end } = rawLogEntry;

          const parsedStart = strictParse(start);

          const parsedEnd = end
            ? strictParse(end)
            : // TODO: P3 bug
              //  Solution 1: dispatch dayChanged() and update active clocks then; simple & works
              //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveClocks selector
              //  Solution 3: use sorted array instead of buckets
              window.moment();

          const dayKeys: string[] = getDaysInRange(parsedStart, parsedEnd).map(
            (day) => day.format(defaultDayFormat),
          );

          return {
            ...rawLogEntry,
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
  }

  async function parseFile(path: string) {
    const cache = metadataCache.getCache(path);

    const tasks = cache?.listItems?.filter(isTaskCache);

    if (!tasks) {
      return undefined;
    }

    const file = vault.getFileByPath(path);

    isNotVoid(
      file,
      "Inconsistent app state: indexing requested for a non-existent file",
    );

    const contents = await vault.cachedRead(file);

    const denormalizedEntries = getDenormalizedEntries(tasks, contents, path);

    return {
      taskEntries: denormalizedEntries.map(({ logEntries, ...rest }) => ({
        logEntries: logEntries?.map((it) => it.id),
        ...rest,
      })),
      logEntries: denormalizedEntries.flatMap((it) => it.logEntries || []),
    };
  }

  return async (action, listenerApi) => {
    const paths = action.payload;

    const normalizedEntriesForPaths = paths.map(async (path) => {
      try {
        const normalizedEntries = await parseFile(path);

        if (!normalizedEntries) {
          return undefined;
        }

        return {
          path,
          ...normalizedEntries,
        };
      } catch (error) {
        console.error(error);

        return undefined;
      }
    });

    const resolved = (await Promise.all(normalizedEntriesForPaths)).filter(
      (entries) => entries !== undefined,
    );

    listenerApi.dispatch(filesIndexed(resolved));
  };
}
