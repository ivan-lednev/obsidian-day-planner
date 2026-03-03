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

interface TrackerSliceState {
  entries: {
    byPath: Record<string, object>;
  };
  logRecords: {
    byId: Record<string, LocalTask>;
    byPath: Record<string, string[]>;

    allIds: Array<string>;

    sortedByStartTime: Array<string>;
    sortedByEndTime: Array<string>;
  };
}

const initialState: TrackerSliceState = {
  entries: { byPath: {} },
  logRecords: {
    byId: {},
    byPath: {},
    allIds: [],
    sortedByStartTime: [],
    sortedByEndTime: [],
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
          entries: Array<{ text: string }>;
        }>,
      ) => {
        const { path, entries } = action.payload;

        state.entries.byPath[path] = entries;
      },
    ),
  }),
  selectors: {
    selectRecentEntries: (state) => Object.values(state.entries.byPath).flat(),
    selectEntriesForPath: (state, path) => state.entries.byPath[path],
  },
});

export const { fileMetadataProcessed, metadataChanged } = trackerSlice.actions;

export const { selectRecentEntries, selectEntriesForPath } =
  trackerSlice.selectors;

type MetadataChanged = ReturnType<typeof metadataChanged>;

export function createTrackerListener(props: {
  listPropsParser: ListPropsParser;
}): AppListenerEffect<MetadataChanged> {
  const { listPropsParser } = props;

  return async (action, listenerApi) => {
    const { path, cache, contents } = action.payload;

    // const listProps = await listPropsParser.parse(path);

    const entries = cache.listItems
      ?.filter((it) => it.task !== undefined)
      .map((it) => {
        const listContent = contents.slice(
          it.position.start.offset,
          it.position.end.offset,
        );
        const listLines = listContent.split("\n");
        const firstLine = listLines[0];

        return {
          text: firstLine,
        };
      });

    listenerApi.dispatch(fileMetadataProcessed({ path, entries }));
  };
}
