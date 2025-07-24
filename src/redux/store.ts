import type {
  Action,
  ConfigureStoreOptions,
  ListenerEffect,
  ListenerMiddlewareInstance,
  ThunkAction,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";

import type { ReduxExtraArgument } from "../types";

import { dataviewChange, dataviewSlice } from "./dataview/dataview-slice";
import { globalSlice } from "./global-slice";
import {
  icalRefreshRequested,
  icalSlice,
  type IcalState,
  initialIcalState,
} from "./ical/ical-slice";
import { searchSlice } from "./search-slice";
import { settingsSlice } from "./settings-slice";
import type { DataviewFacade } from "../service/dataview-facade";
import type { MetadataCache, TFile, Vault } from "obsidian";
import type DayPlanner from "../main";
import type { PluginData } from "../settings";
import { initListenerMiddleware } from "./listener-middleware";
import { icalRefreshIntervalMillis } from "../constants";

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

export function initStoreForPlugin(props: {
  pluginData: PluginData;
  dataviewFacade: DataviewFacade;
  vault: Vault;
  metadataCache: MetadataCache;
  plugin: DayPlanner;
}) {
  const { pluginData, dataviewFacade, vault, metadataCache, plugin } = props;

  const icalStateWithCachedRawIcals: IcalState = {
    ...initialIcalState,
    plainTextIcals: pluginData.rawIcals || [],
  };

  const listenerMiddleware = initListenerMiddleware({
    extra: {
      dataviewFacade,
      vault,
      metadataCache,
      onIcalsFetched: async (rawIcals) => {
        await plugin.saveData({ ...plugin.settings(), rawIcals });
      },
    },
  });

  const store = makeStore({
    preloadedState: {
      ical: icalStateWithCachedRawIcals,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(listenerMiddleware.middleware);
    },
  });

  plugin.register(() => {
    listenerMiddleware.clearListeners();
  });

  plugin.registerInterval(
    window.setInterval(() => {
      store.dispatch(icalRefreshRequested());
    }, icalRefreshIntervalMillis),
  );

  plugin.registerEvent(
    metadataCache.on(
      // @ts-expect-error
      "dataview:metadata-change",
      (eventType: unknown, file: TFile) =>
        store.dispatch(dataviewChange(file.path)),
    ),
  );

  return { store, listenerMiddleware };
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
