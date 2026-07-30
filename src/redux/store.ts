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

import type { IndexService } from "../service/index/index-service";
import type { ListPropsParser } from "../service/list-props-parser";
import type { PeriodicNotes } from "../service/periodic-notes";
import type { DayPlannerSettings } from "../settings";
import type { PointerDateTime, ReduxExtraArgument } from "../types";
import type { Scheduler } from "../util/scheduler";

import { createDateRanges } from "./date-ranges";
import { dateRangesSlice } from "./date-ranges-slice";
import { icalSlice, selectRemoteTimeBlocks } from "./ical/ical-slice";
import type { IcalParseTaskResult } from "./ical/init-ical-listeners";
import { selectPlanTimeBlocksForVisibleDays } from "./index/index-selectors";
import { indexSlice } from "./index/index-slice";
import { initListenerMiddleware } from "./listener-middleware";
import { settingsSlice } from "./settings-slice";
import { createUseSelector } from "./use-selector";

const rootReducer = combineSlices(
  dateRangesSlice,
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
  indexServices: IndexService[];
  vault: Vault;
  metadataCache: MetadataCache;
  periodicNotes: PeriodicNotes;
  settings: DayPlannerSettings;
  icalParseScheduler: Scheduler<IcalParseTaskResult>;
}) {
  const {
    preloadedState = {},
    listPropsParser,
    indexServices,
    vault,
    metadataCache,
    periodicNotes,
    settings,
    icalParseScheduler,
  } = props;

  const listenerMiddleware = initListenerMiddleware({
    extra: {
      listPropsParser,
      indexServices,
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

  const useSelector = createUseSelector<RootState>(store);
  const dateRanges = createDateRanges({ store, useSelector });

  const localTimeBlocksSignal = useSelector((state) =>
    selectPlanTimeBlocksForVisibleDays(state),
  );
  const localTimeBlocks = toStore(() => localTimeBlocksSignal.current);

  const remoteTimeBlocksSignal = useSelector((state) =>
    selectRemoteTimeBlocks(state),
  );
  const remoteTimeBlocks = toStore(() => remoteTimeBlocksSignal.current);

  const pointerDateTime = writable<PointerDateTime>({
    dateTime: window.moment(),
    type: "dateTime",
  });

  return {
    store,
    listenerMiddleware,
    remoteTimeBlocks,
    localTimeBlocks,
    pointerDateTime,
    useSelector,
    dateRanges,
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
