import {
  type Action,
  type ConfigureStoreOptions,
  isAnyOf,
  type ListenerEffect,
  type ListenerMiddlewareInstance,
  type ThunkAction,
  type TypedStartListening,
} from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { derived, writable } from "svelte/store";

import type { DataviewFacade } from "../service/dataview-facade";
import type { ListPropsParser } from "../service/list-props-parser";
import type { PointerDateTime, ReduxExtraArgument } from "../types";
import { getUpdateTrigger } from "../util/store";

import {
  dataviewSlice,
  listPropsParsed,
  selectDataviewLoaded,
  selectListProps,
} from "./dataview/dataview-slice";
import { editCanceled, globalSlice } from "./global-slice";
import { icalSlice, type RawIcal, selectRemoteTasks } from "./ical/ical-slice";
import { initListenerMiddleware } from "./listener-middleware";
import { searchSlice } from "./search-slice";
import { selectDataviewSource, settingsSlice } from "./settings-slice";
import { useActionDispatched } from "./use-action-dispatched";
import { createUseSelector } from "./use-selector";

const rootReducer = combineSlices(
  globalSlice,
  searchSlice,
  dataviewSlice,
  settingsSlice,
  icalSlice,
);

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (
  props: Omit<
    ConfigureStoreOptions<RootState>,
    "preloadedState" | "reducer"
  > & {
    preloadedState?: Partial<RootState>;
  },
) => {
  const { preloadedState, middleware } = props;

  return configureStore({
    reducer: rootReducer,
    middleware,
    preloadedState,
  });
};

export function createReactor(props: {
  preloadedState: Partial<RootState>;
  dataviewFacade: DataviewFacade;
  listPropsParser: ListPropsParser;
  onIcalsFetched: (rawIcals: RawIcal[]) => Promise<void>;
}) {
  const { preloadedState, dataviewFacade, listPropsParser, onIcalsFetched } =
    props;

  const listenerMiddleware = initListenerMiddleware({
    extra: {
      dataviewFacade,
      listPropsParser,
      onIcalsFetched,
    },
  });

  const store = makeStore({
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(listenerMiddleware.middleware);
    },
  });

  const { dispatch, getState } = store;

  const useSelector = createUseSelector(store);
  const actionDispatched = useActionDispatched({ listenerMiddleware });

  const remoteTasks = useSelector(selectRemoteTasks);
  const listProps = useSelector(selectListProps);
  const dataviewLoaded = useSelector(selectDataviewLoaded);
  const dataviewSource = useSelector(selectDataviewSource);

  const isDataviewRefreshSignal = isAnyOf(listPropsParsed, editCanceled);
  const dataviewRefreshSignal = derived(
    actionDispatched,
    ($actionDispatched, set) => {
      if (isDataviewRefreshSignal($actionDispatched)) {
        set($actionDispatched);
      }
    },
  );

  const taskUpdateTrigger = derived(
    [dataviewRefreshSignal, dataviewSource],
    getUpdateTrigger,
  );

  const pointerDateTime = writable<PointerDateTime>({
    dateTime: window.moment(),
    type: "dateTime",
  });

  return {
    getState,
    dispatch,
    listenerMiddleware,
    remoteTasks,
    taskUpdateTrigger,
    listProps,
    dataviewLoaded,
    pointerDateTime,
    dataviewRefreshSignal,
    useSelector,
  };
}

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
export type AppListenerEffect<A extends Action = Action> = ListenerEffect<
  A,
  RootState,
  AppDispatch
>;
export type AppListenerMiddlewareInstance = ListenerMiddlewareInstance<
  RootState,
  AppDispatch,
  ReduxExtraArgument
>;
