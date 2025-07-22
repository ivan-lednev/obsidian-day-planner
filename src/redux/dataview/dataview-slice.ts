import { type PayloadAction } from "@reduxjs/toolkit";
import type { STask } from "obsidian-dataview";

import { createAppSlice } from "../create-app-slice";

type LineToListProps = Record<number, unknown>;
type PathToListProps = Record<string, LineToListProps>;

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
  },
});

export const { dataviewChange, dataviewTasksUpdated, listPropsParsed } =
  dataviewSlice.actions;
export const { selectDataviewTasks, selectListProps } = dataviewSlice.selectors;

export type DataviewChangeAction = ReturnType<typeof dataviewChange>;
