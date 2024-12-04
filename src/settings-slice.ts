import { type PayloadAction } from "@reduxjs/toolkit";

import { createAppSlice } from "./createAppSlice";
import { createSelectorChangePredicate } from "./redux-util";
import { type DayPlannerSettings, defaultSettings } from "./settings";

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

export const checkDataviewSourceChanged =
  createSelectorChangePredicate(selectDataviewSource);
