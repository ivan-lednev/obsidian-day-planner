import { type PayloadAction } from "@reduxjs/toolkit";
import type { CachedMetadata, Pos } from "obsidian";
import { isNotVoid } from "typed-assert";

import { defaultDayFormat } from "../../constants";
import type { ListPropsParser } from "../../service/list-props-parser";
import { getDaysInRange } from "../../util/moment";
import type { Props } from "../../util/props";
import { createAppSlice } from "../create-app-slice";
import type { AppListenerEffect } from "../store";

export type ListPropsParseResult = {
  parsed: Props;
  position: Pos;
};

export type LineToListProps = Record<number, ListPropsParseResult>;
export type PathToListProps = Record<string, LineToListProps>;

export interface ListPropsParsedPayload {
  path: string;
  lineToListProps?: LineToListProps;
}

interface TaskEntry {
  id: string;
  text: string;
  logEntries?: string[];
}

interface LogEntry {
  start: string;
  end?: string;
  parent: string;
  dayKeys: string[];
  id: string;
}

interface TrackerSliceState {
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

const initialState: TrackerSliceState = {
  taskEntries: { byPath: {}, byId: {} },
  logEntries: {
    byPath: {},
    byId: {},
    byDay: {},
  },
};

interface MetadataChangedPayload {
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
    metadataChanged: create.reducer(
      (state, action: PayloadAction<MetadataChangedPayload>) => {},
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
        .map((it) => {
          const taskEntry = state.taskEntries.byId[it.parent];

          isNotVoid(taskEntry, "Inconsistent store state");

          return { ...it, text: taskEntry.text };
        }),
    selectLogEntriesForDayKeys: (state, dayKeys: string[]) => {
      // todo: filter unique
      const uniqueLogEntryKeysForDayKeys = new Set(
        dayKeys.flatMap((dayKey) => state.logEntries.byDay[dayKey] || []),
      );

      return [...uniqueLogEntryKeysForDayKeys].map(
        (logEntryKey) => state.logEntries.byId[logEntryKey],
      );
    },
  },
});

export const { fileMetadataProcessed, metadataChanged, fileDeleted } =
  trackerSlice.actions;

export const {
  selectEntriesForPath,
  selectActiveClocks,
  selectLogEntriesForDayKeys,
} = trackerSlice.selectors;

type MetadataChanged = ReturnType<typeof metadataChanged>;

const idSeparator = "::";

function createId(...args: (string | number)[]) {
  return args.join(idSeparator);
}

export function createTrackerListener(props: {
  listPropsParser: ListPropsParser;
}): AppListenerEffect<MetadataChanged> {
  const { listPropsParser } = props;

  return async (action, listenerApi) => {
    const { path, cache, contents } = action.payload;

    const taskEntries = cache.listItems
      ?.filter((it) => it.task !== undefined)
      .map((it) => {
        const listItemText = contents.slice(
          it.position.start.offset,
          it.position.end.offset,
        );
        const listItemLines = listItemText.split("\n");
        const firstLine = listItemLines[0];

        isNotVoid(firstLine, "The first line of any list cannot be empty");

        const listItemProps = listPropsParser.getListPropsFromListItem(
          it,
          listItemText,
        );
        const taskEntryId = createId(path, it.position.start.line);

        const logEntries = listItemProps?.parsed.planner?.log?.map(
          (it, index) => {
            const { start, end } = it;

            const parsedStart = window.moment(
              start,
              window.moment.ISO_8601,
              true,
            );
            const parsedEnd = end
              ? window.moment(end, window.moment.ISO_8601, true)
              : window.moment();

            const dayKeys: string[] = getDaysInRange(
              parsedStart,
              parsedEnd,
            ).map((day) => day.format(defaultDayFormat));

            return {
              ...it,
              parent: taskEntryId,
              dayKeys,
              id: createId(taskEntryId, index),
            };
          },
        );

        return {
          id: taskEntryId,
          text: firstLine,
          logEntries,
        };
      });

    listenerApi.dispatch(
      fileMetadataProcessed({
        path,
        taskEntries: taskEntries?.map(({ id, text, logEntries }) => ({
          id,
          text,
          logEntries: logEntries?.map((it) => it.id),
        })),
        logEntries: taskEntries?.flatMap((it) => it.logEntries || []),
      }),
    );
  };
}
