import { type PayloadAction } from "@reduxjs/toolkit";
import type { Pos } from "obsidian";
import type { STask } from "obsidian-dataview";

import { createAppSlice } from "../create-app-slice";

export type ListPropsParseResult = {
  parsed: Record<string, unknown>;
  position: Pos;
  raw: string;
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
    dataviewTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<STask>>) => {
        state.dataviewTasks = action.payload;
      },
    ),
    listPropsParsed: create.reducer(
      (
        state,
        action: PayloadAction<{
          path: string;
          lineToListProps?: LineToListProps;
        }>,
      ) => {
        const { path, lineToListProps } = action.payload;

        if (!lineToListProps || Object.keys(lineToListProps).length === 0) {
          return;
        }

        state.listProps[path] = lineToListProps;
      },
    ),
  }),
  selectors: {
    selectDataviewTasks: (state) => state.dataviewTasks,
    selectListProps: (state) => state.listProps,
    selectListPropsForPath: (state, path: string) => state.listProps[path],
    selectDataviewLoaded: (state) => state.dataviewLoaded,
  },
});

export const { dataviewChange, dataviewTasksUpdated, listPropsParsed } =
  dataviewSlice.actions;

export const {
  selectDataviewTasks,
  selectListProps,
  selectDataviewLoaded,
  selectListPropsForPath,
} = dataviewSlice.selectors;

export type DataviewChangeAction = ReturnType<typeof dataviewChange>;
