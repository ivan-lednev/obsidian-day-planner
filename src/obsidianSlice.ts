import ical from "node-ical";
import { createAppSlice } from "./createAppSlice";
import { createAction, PayloadAction } from "@reduxjs/toolkit";
import { DayPlannerSettings, defaultSettings } from "./settings";
import { WithIcalConfig } from "./types";
import { getDayKey } from "./util/tasks-utils";
import { uniqBy } from "lodash/fp";

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

export const obsidianSlice = createAppSlice({
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
    online: create.reducer((state) => {
      state.isOnline = true;
    }),
    offline: create.reducer((state) => {
      state.isOnline = false;
    }),
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
    recurrentEventsComputed: create.reducer((state, action: PayloadAction<>))
  }),
  selectors: {
    selectDataviewSource: (state) => state.settings.dataviewSource,
    selectSettings: (state) => state.settings,
    // todo: might need to replicate the 'previousDays' login to avoid extra work
    selectVisibleDays: (state) => {
      const days = Object.values(state.dateRanges).flat();
      const uniqDays = new Set(days);

      return [...uniqDays].sort();
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
  // todo: keyDown, keyUp
  modDown,
  modUp,
  online,
  offline,
  icalEventsUpdated,
  dateRangeClosed,
  dateRangeOpened,
  settingsLoaded,
} = obsidianSlice.actions;
export const { selectDataviewSource, selectSettings, selectVisibleDays } =
  obsidianSlice.selectors;
