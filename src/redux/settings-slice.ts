import { type PayloadAction } from "@reduxjs/toolkit";

import { type DayPlannerSettings, defaultSettings } from "../settings";

import { createAppSlice } from "./create-app-slice";

interface SettingsSliceState {
  settings: DayPlannerSettings;
}

export const initialState: SettingsSliceState = {
  settings: defaultSettings,
};

export const settingsSlice = createAppSlice({
  name: "settings",
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
  }),
  selectors: {
    selectDataviewSource: (state) => state.settings.dataviewSource,
    selectIcals: (state) => state.settings.icals,
    selectSettings: (state) => state.settings,
  },
});

export const { settingsUpdated, settingsLoaded } = settingsSlice.actions;

export const { selectDataviewSource, selectSettings, selectIcals } =
  settingsSlice.selectors;
