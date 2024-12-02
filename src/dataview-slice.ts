import { createAction, type PayloadAction } from "@reduxjs/toolkit";
import type { STask } from "obsidian-dataview";

import { createAppSlice } from "./createAppSlice";

interface DataviewSliceState {
  dataviewTasks: Array<STask>;
  dataviewLoaded: boolean;
}

const initialState: DataviewSliceState = {
  dataviewTasks: [],
  dataviewLoaded: false,
};

export const dataviewSlice = createAppSlice({
  name: "dataview",
  initialState,
  reducers: (create) => ({
    dataviewChange: create.reducer((state) => {
      state.dataviewLoaded = true;
    }),
    dataviewTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<STask>>) => {
        state.dataviewTasks = action.payload;
      },
    ),
  }),
  selectors: {
    selectDataviewTasks: (state) => state.dataviewTasks,
  },
});

export const dataviewRefreshRequested = createAction(
  "obsidian/dataviewRefreshRequested",
);
export const dataviewListenerStarted = createAction(
  "obsidian/dataviewListenerStarted",
);
export const dataviewListenerStopped = createAction(
  "obsidian/dataviewListenerStopped",
);

export const { dataviewChange, dataviewTasksUpdated } = dataviewSlice.actions;

export const { selectDataviewTasks } = dataviewSlice.selectors;
