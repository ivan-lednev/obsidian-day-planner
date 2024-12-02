import { createAction, type PayloadAction } from "@reduxjs/toolkit";
import ical from "node-ical";

import { createAppSlice } from "./createAppSlice";
import type { WithIcalConfig } from "./types";
import type { PointerDateTime } from "./util/create-hooks.svelte";

interface ObsidianSliceState {
  pointerDateTime: PointerDateTime;
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  dateRanges: Record<string, string[]>;
  layoutReady: boolean;
  isDarkMode: boolean;
  modPressed: boolean;
  isOnline: boolean;
}

const initialState: ObsidianSliceState = {
  icalEvents: [],
  dateRanges: {},
  layoutReady: false,
  isDarkMode: false,
  modPressed: false,
  isOnline: window.navigator.onLine,
  pointerDateTime: {},
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
  }),
  selectors: {
    selectIsOnline: (state) => state.isOnline,
    selectVisibleDays: (state) => {
      const days = Object.values(state.dateRanges).flat();

      return [...new Set(days)].sort();
    },
  },
});

export const keyDown = createAction("obsidian/keyDown");

export const icalRefreshRequested = createAction(
  "obsidian/icalRefreshRequested",
);
export const icalListenerStarted = createAction("obsidian/icalListenerStarted");
export const icalListenerStopped = createAction("obsidian/icalListenerStopped");

export const {
  darkModeUpdated,
  layoutReady,
  modDown,
  modUp,
  networkStatusChanged,
  icalEventsUpdated,
  dateRangeClosed,
  dateRangeOpened,
} = globalSlice.actions;

export const { selectVisibleDays, selectIsOnline } = globalSlice.selectors;
