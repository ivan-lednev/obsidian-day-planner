import { type PayloadAction } from "@reduxjs/toolkit";
import type { CachedMetadata, Pos, TFile } from "obsidian";

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
  logRecords: {
    byId: Record<string, LocalTask>;
    byPath: Record<string, string[]>;

    allIds: Array<string>;

    sortedByStartTime: Array<string>;
    sortedByEndTime: Array<string>;
  };
}

const initialState: TrackerSliceState = {
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
    listPropsParsed: create.reducer(
      (state, action: PayloadAction<ListPropsParsedPayload>) => {
        const { path, lineToListProps } = action.payload;

        state.listProps[path] = lineToListProps || {};
      },
    ),
  }),
  selectors: {},
});

const { listPropsParsed, metadataChanged } = trackerSlice.actions;

type MetadataChanged = ReturnType<typeof metadataChanged>;

export function createListPropsParseListener(props: {
  listPropsParser: ListPropsParser;
}): AppListenerEffect<MetadataChanged> {
  const { listPropsParser } = props;

  return async (action, listenerApi) => {
    const { path } = action.payload;

    const listProps = await listPropsParser.parse(path);

    listenerApi.dispatch(listPropsParsed({ path, lineToListProps: listProps }));
  };
}
