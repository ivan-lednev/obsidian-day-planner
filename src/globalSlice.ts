import ical from "node-ical";
import { createAppSlice } from "./createAppSlice";
import { createAction, type PayloadAction } from "@reduxjs/toolkit";
import { type DayPlannerSettings, defaultSettings } from "./settings";
import type { WithIcalConfig } from "./types";

interface ObsidianSliceState {
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  dateRanges: Record<string, string[]>;
  layoutReady: boolean;
  isDarkMode: boolean;
  modPressed: boolean;
  dataviewLoaded: boolean;
  isOnline: boolean;
  settings: DayPlannerSettings;
}

const initialState: ObsidianSliceState = {
  icalEvents: [],
  dateRanges: {},
  layoutReady: false,
  isDarkMode: false,
  modPressed: false,
  dataviewLoaded: false,
  isOnline: window.navigator.onLine,
  settings: defaultSettings,
};

export const globalSlice = createAppSlice({
  name: "obsidian",
  initialState,
  reducers: (create) => ({
    settingsUpdated: create.reducer(
      (state, action: PayloadAction<Partial<DayPlannerSettings>>) => {
        state.settings = { ...state.settings, ...action.payload };
      },
    ),
    settingsLoaded: create.reducer(
      (state, action: PayloadAction<DayPlannerSettings>) => {
        state.settings = action.payload;
      },
    ),
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
    dataviewChange: create.reducer((state) => {
      state.dataviewLoaded = true;
    }),
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
    selectDataviewSource: (state) => state.settings.dataviewSource,
    selectSettings: (state) => state.settings,
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

export const {
  dataviewChange,
  settingsUpdated,
  darkModeUpdated,
  layoutReady,
  modDown,
  modUp,
  networkStatusChanged,
  icalEventsUpdated,
  dateRangeClosed,
  dateRangeOpened,
  settingsLoaded,
} = globalSlice.actions;

export const { selectDataviewSource, selectSettings, selectVisibleDays } =
  globalSlice.selectors;
