import { createSelector, type PayloadAction } from "@reduxjs/toolkit";

import { defaultDayFormat } from "../constants";

import { createAppSlice } from "./create-app-slice";

interface ObsidianSliceState {
  visibleDays: string[];
}

export const initialState: ObsidianSliceState = {
  visibleDays: [],
};

export const globalSlice = createAppSlice({
  name: "obsidian",
  initialState,
  reducers: (create) => ({
    visibleDaysUpdated: create.reducer(
      (state, action: PayloadAction<string[]>) => {
        state.visibleDays = action.payload;
      },
    ),
    editCanceled: () => {},
  }),
  selectors: {
    selectVisibleDays: (state) => state.visibleDays,
  },
});

export const { visibleDaysUpdated, editCanceled } = globalSlice.actions;

export const { selectVisibleDays } = globalSlice.selectors;

export const selectSortedDedupedVisibleDays = createSelector(
  selectVisibleDays,
  (days) => {
    return [...new Set(days)]
      .sort()
      .map((it) => window.moment(it, defaultDayFormat));
  },
);
