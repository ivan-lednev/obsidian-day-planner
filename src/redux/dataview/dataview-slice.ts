import { type PayloadAction } from "@reduxjs/toolkit";
import type { Pos } from "obsidian";
import type { STask } from "obsidian-dataview";

import { createAppSlice } from "../create-app-slice";

import type { Props } from "src/util/props";

export type ListPropsParseResult = {
  parsed: Props;
  position: Pos;
};

export type LineToListProps = Record<number, ListPropsParseResult>;

export type PathToListProps = Record<string, LineToListProps>;

interface DataviewSliceState {
  dataviewTasks: Array<STask>;
  dataviewLoaded: boolean;
  listProps: PathToListProps;
}

const initialState: DataviewSliceState = {
  dataviewTasks: [],
  dataviewLoaded: false,
  listProps: {},
};

export const dataviewSlice = createAppSlice({
  name: "dataview",
  initialState,
  reducers: (create) => ({
    dataviewChange: create.reducer((state, action: PayloadAction<string>) => {
      state.dataviewLoaded = true;
    }),
    listPropsParsed: create.reducer(
      (
        state,
        action: PayloadAction<{
          path: string;
          lineToListProps?: LineToListProps;
        }>,
      ) => {
        const { path, lineToListProps } = action.payload;

        state.listProps[path] = lineToListProps || {};
      },
    ),
  }),
  selectors: {
    selectListPropsForLocation: (state, path: string, line: number) =>
      state.listProps[path]?.[line],
    selectDataviewLoaded: (state) => state.dataviewLoaded,
  },
});

export const { dataviewChange, listPropsParsed } = dataviewSlice.actions;

export const { selectDataviewLoaded, selectListPropsForLocation } =
  dataviewSlice.selectors;

export type DataviewChangeAction = ReturnType<typeof dataviewChange>;
