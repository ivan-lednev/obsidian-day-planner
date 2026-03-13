import { type PayloadAction } from "@reduxjs/toolkit";
import type { CachedMetadata, Pos } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { ListPropsParser } from "../../service/list-props-parser";
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
  id: string;
}

interface TrackerSliceState {
  taskEntries: {
    byPath: Record<string, string[]>;
    byId: Record<string, TaskEntry>;
  };
  logEntries: {
    byPath: Record<string, LogEntry[]>;
  };
}

const initialState: TrackerSliceState = {
  taskEntries: { byPath: {}, byId: {} },
  logEntries: {
    byPath: {},
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
        delete state.logEntries.byPath[path];
      },
    ),
    fileMetadataProcessed: create.reducer(
      (state, action: PayloadAction<FileMetadataProcessedPayload>) => {
        const { path, taskEntries, logEntries } = action.payload;

        if (taskEntries) {
          state.taskEntries.byPath[path] = taskEntries.map((it) => it.id);

          taskEntries.forEach((it) => {
            state.taskEntries.byId[it.id] = it;
          });
        }

        if (logEntries) {
          state.logEntries.byPath[path] = logEntries;
        }
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
      Object.values(state.logEntries.byPath)
        .flat()
        .filter((it) => !it.end)
        .map((it) => {
          const taskEntry = state.taskEntries.byId[it.parent];

          isNotVoid(taskEntry, "Inconsistent store state");

          return { ...it, text: taskEntry.text };
        }),
  },
});

export const { fileMetadataProcessed, metadataChanged, fileDeleted } =
  trackerSlice.actions;

export const { selectEntriesForPath, selectActiveClocks } =
  trackerSlice.selectors;

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
          (it, index) => ({
            ...it,
            parent: taskEntryId,
            id: createId(taskEntryId, index),
          }),
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
