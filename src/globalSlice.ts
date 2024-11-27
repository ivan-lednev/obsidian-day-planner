import ical from "node-ical";
import { createAppSlice } from "./createAppSlice";
import { createAction, type PayloadAction } from "@reduxjs/toolkit";
import { type DayPlannerSettings, defaultSettings } from "./settings";
import type { WithIcalConfig } from "./types";
import type { PointerDateTime } from "./util/create-hooks.svelte";
import type { STask } from "obsidian-dataview";

interface ObsidianSliceState {
  pointerDateTime: PointerDateTime;
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  dateRanges: Record<string, string[]>;
  dataviewTasks: Array<STask>;
  layoutReady: boolean;
  isDarkMode: boolean;
  modPressed: boolean;
  dataviewLoaded: boolean;
  isOnline: boolean;
  settings: DayPlannerSettings;
}

const initialState: ObsidianSliceState = {
  icalEvents: [],
  dataviewTasks: [],
  dateRanges: {},
  layoutReady: false,
  isDarkMode: false,
  modPressed: false,
  dataviewLoaded: false,
  isOnline: window.navigator.onLine,
  settings: defaultSettings,
  pointerDateTime: {},
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

    // todo: move to another slice
    dataviewChange: create.reducer((state) => {
      state.dataviewLoaded = true;
    }),
    dataviewTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<STask>>) => {
        state.dataviewTasks = action.payload;
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
    selectDataviewSource: (state) => state.settings.dataviewSource,
    selectDataviewTasks: (state) => state.dataviewTasks,
    selectSettings: (state) => state.settings,
    selectVisibleDays: (state) => {
      const days = Object.values(state.dateRanges).flat();

      return [...new Set(days)].sort();
    },
  },
});

export const keyDown = createAction("obsidian/keyDown");

export const dataviewRefreshRequested = createAction(
  "obsidian/dataviewRefreshRequested",
);
export const dataviewListenerStarted = createAction(
  "obsidian/dataviewListenerStarted",
);
export const dataviewListenerStopped = createAction(
  "obsidian/dataviewListenerStopped",
);

export const icalRefreshRequested = createAction(
  "obsidian/icalRefreshRequested",
);
export const icalListenerStarted = createAction("obsidian/icalListenerStarted");
export const icalListenerStopped = createAction("obsidian/icalListenerStopped");

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
  dataviewTasksUpdated,
} = globalSlice.actions;

export const {
  selectDataviewSource,
  selectSettings,
  selectVisibleDays,
  selectIsOnline,
  selectDataviewTasks,
} = globalSlice.selectors;
