import type { Action, Selector, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { globalSlice } from "./globalSlice";
import { listenerMiddleware } from "./listenerMiddleware";
import { searchSlice } from "./search-slice";

const rootReducer = combineSlices(globalSlice, searchSlice);

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (props: {
  preloadedState?: Partial<RootState>;
  middleware: any;
}) => {
  const { preloadedState, middleware } = props;

  return configureStore({
    reducer: rootReducer,
    middleware,
    preloadedState,
  });
};

// export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
