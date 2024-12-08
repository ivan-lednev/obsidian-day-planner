import type {
  Action,
  ThunkAction,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";

import type { ReduxExtraArgument } from "../types";

import { dataviewSlice } from "./dataview/dataview-slice";
import { globalSlice } from "./global-slice";
import { icalSlice } from "./ical/ical-slice";
import { searchSlice } from "./search-slice";
import { settingsSlice } from "./settings-slice";

const rootReducer = combineSlices(
  globalSlice,
  searchSlice,
  dataviewSlice,
  settingsSlice,
  icalSlice,
);

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (props: {
  preloadedState?: Partial<RootState>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middleware: any;
}) => {
  const { preloadedState, middleware } = props;

  return configureStore({
    reducer: rootReducer,
    middleware,
    preloadedState,
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
export type StartListeningFn = TypedStartListening<
  RootState,
  AppDispatch,
  ReduxExtraArgument
>;