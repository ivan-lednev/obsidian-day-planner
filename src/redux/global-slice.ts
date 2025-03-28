import {
  createAction,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit";
import ical from "node-ical";

import { defaultDayFormat } from "../constants";
import type { PointerDateTime, WithIcalConfig } from "../types";

import { createAppSlice } from "./create-app-slice";

interface ObsidianSliceState {
  pointerDateTime: PointerDateTime;
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  dateRanges: Record<string, string[]>;
  layoutReady: boolean;
  isDarkMode: boolean;
  modPressed: boolean;
  isOnline: boolean;
  visibleDays: string[];
}

export const initialState: ObsidianSliceState = {
  icalEvents: [],
  dateRanges: {},
  layoutReady: false,
  isDarkMode: false,
  modPressed: false,
  isOnline: window.navigator.onLine,
  pointerDateTime: {},
  // todo: remove after date ranges are migrated to Redux
  visibleDays: [],
};

export const globalSlice = createAppSlice({
  name: "obsidian",
  initialState,
  reducers: (create) => ({
    icalEventsUpdated: create.reducer(
      (
        state,
        action: PayloadAction<
          WithIcalConfig<Array<WithIcalConfig<ical.VEvent>>>
        >,
      ) => {
        state.icalEvents = action.payload;
      },
    ),
    layoutReady: create.reducer((state) => {
      state.layoutReady = true;
    }),
    pointerDateTime: create.reducer(
      (state, action: PayloadAction<PointerDateTime>) => {
        state.pointerDateTime = action.payload;
      },
    ),
    darkModeUpdated: create.reducer((state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    }),
    modDown: create.reducer((state) => {
      state.modPressed = true;
    }),
    modUp: create.reducer((state) => {
      state.modPressed = false;
    }),
    networkStatusChanged: create.reducer(
      (state, action: PayloadAction<{ isOnline: boolean }>) => {
        const { isOnline } = action.payload;

        state.isOnline = isOnline;
      },
    ),
    dateRangeOpened: create.reducer(
      (state, action: PayloadAction<{ id: string; range: string[] }>) => {
        const { id, range } = action.payload;

        state.dateRanges[id] = range;
      },
    ),
    dateRangeClosed: create.reducer((state, action: PayloadAction<string>) => {
      delete state.dateRanges[action.payload];
    }),
    visibleDaysUpdated: create.reducer(
      (state, action: PayloadAction<string[]>) => {
        state.visibleDays = action.payload;
      },
    ),
  }),
  selectors: {
    selectIsOnline: (state) => state.isOnline,
    selectVisibleDays: (state) => state.visibleDays,
  },
});

export const keyDown = createAction("obsidian/keyDown");

export const {
  darkModeUpdated,
  layoutReady,
  modDown,
  modUp,
  networkStatusChanged,
  icalEventsUpdated,
  dateRangeClosed,
  dateRangeOpened,
  visibleDaysUpdated,
} = globalSlice.actions;

export const { selectVisibleDays, selectIsOnline } = globalSlice.selectors;

export const selectSortedDedupedVisibleDays = createSelector(
  selectVisibleDays,
  (days) => {
    return [...new Set(days)]
      .sort()
      .map((it) => window.moment(it, defaultDayFormat));
  },
);
