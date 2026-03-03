import { type PayloadAction } from "@reduxjs/toolkit";
import type { CachedMetadata, Pos } from "obsidian";

import { createAppSlice } from "../create-app-slice";

import type { Props } from "src/util/props";
import type { LocalTask } from "../../task-types";
import type { ListPropsParser } from "../../service/list-props-parser";
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
  text: string;
  logEntries?: string[];
}

interface LogEntry {
  start: string;
  end: string;
  parent: string;
}

interface TrackerSliceState {
  taskEntries: {
    byPath: Record<string, TaskEntry[]>;
  };
  logEntries: {
    byPath: Record<string, LogEntry[]>;
  };
}

const initialState: TrackerSliceState = {
  taskEntries: { byPath: {} },
  logEntries: {
    byPath: {},
  },
};

export const trackerSlice = createAppSlice({
  name: "tracker",
  initialState,
  reducers: (create) => ({
    metadataChanged: create.reducer(
      (
        state,
        action: PayloadAction<{
          path: string;
          contents: string;
          cache: CachedMetadata;
        }>,
      ) => {},
    ),
    fileMetadataProcessed: create.reducer(
      (
        state,
        action: PayloadAction<{
          path: string;
          taskEntries?: TaskEntry[];
          logEntries?: LogEntry[];
        }>,
      ) => {
        const { path, taskEntries } = action.payload;

        if (taskEntries) {
          state.taskEntries.byPath[path] = taskEntries;
        }
      },
    ),
  }),
  selectors: {
    selectRecentEntries: (state) =>
      Object.values(state.taskEntries.byPath).flat(),
    selectEntriesForPath: (state, path) => state.taskEntries.byPath[path],
    selectActiveClocks: (state) =>
      Object.values(state.logEntries.byPath)
        .flat()
        .filter((it) => !it.end),
  },
});

export const { fileMetadataProcessed, metadataChanged } = trackerSlice.actions;

export const { selectRecentEntries, selectEntriesForPath, selectActiveClocks } =
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

    // const listProps = await listPropsParser.parse(path);

    const taskEntries = cache.listItems
      ?.filter((it) => it.task !== undefined)
      .map((it) => {
        const listItemText = contents.slice(
          it.position.start.offset,
          it.position.end.offset,
        );
        const listItemLines = listItemText.split("\n");
        const firstLine = listItemLines[0];
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
