import {
  type Action,
  type ConfigureStoreOptions,
  type ListenerEffect,
  type ListenerMiddlewareInstance,
  type ThunkAction,
  type TypedStartListening,
} from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import type { MetadataCache, Vault } from "obsidian";
import { toStore, writable } from "svelte/store";

import type { ListPropsParser } from "../service/list-props-parser";
import type { PeriodicNotes } from "../service/periodic-notes";
import type { DayPlannerSettings } from "../settings";
import type { PointerDateTime, ReduxExtraArgument } from "../types";
import type { Scheduler } from "../util/scheduler";

import { globalSlice } from "./global-slice";
import { icalSlice, selectRemoteTasks } from "./ical/ical-slice";
import type { IcalParseTaskResult } from "./ical/init-ical-listeners";
import { selectPlanEntriesForVisibleDays } from "./index/index-selectors";
import { indexSlice } from "./index/index-slice";
import { initListenerMiddleware } from "./listener-middleware";
import { settingsSlice } from "./settings-slice";
import { createUseSelector } from "./use-selector";

const rootReducer = combineSlices(
  globalSlice,
  settingsSlice,
  icalSlice,
  indexSlice,
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
  preloadedState?: Partial<RootState>;
  listPropsParser: ListPropsParser;
  vault: Vault;
  metadataCache: MetadataCache;
  periodicNotes: PeriodicNotes;
  settings: DayPlannerSettings;
  icalParseScheduler: Scheduler<IcalParseTaskResult>;
}) {
  const {
    preloadedState = {},
    listPropsParser,
    vault,
    metadataCache,
    periodicNotes,
    settings,
    icalParseScheduler,
  } = props;

  const listenerMiddleware = initListenerMiddleware({
    extra: {
      listPropsParser,
      vault,
      metadataCache,
      periodicNotes,
      settings,
      icalParseScheduler,
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

  const localTasksSignal = useSelector((state) =>
    selectPlanEntriesForVisibleDays(state),
  );
  const localTasks = toStore(() => localTasksSignal.current);

  const remoteTasksSignal = useSelector((state) => selectRemoteTasks(state));
  const remoteTasks = toStore(() => remoteTasksSignal.current);

  const pointerDateTime = writable<PointerDateTime>({
    dateTime: window.moment(),
    type: "dateTime",
  });

  return {
    store,
    getState,
    dispatch,
    listenerMiddleware,
    remoteTasks,
    localTasks,
    pointerDateTime,
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
