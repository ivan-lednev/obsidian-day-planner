import { createListenerMiddleware } from "@reduxjs/toolkit";

import type { ReduxExtraArgument } from "../types";

import { icalRefreshRequested } from "./ical/ical-slice";
import {
  checkIcalEventsChanged,
  checkVisibleDaysChanged,
  createCachingFetcher,
  createIcalFetchListener,
  createIcalParseListener,
} from "./ical/init-ical-listeners";
import { createIndexListener, indexRequested } from "./index/index-slice";
import type { AppDispatch, RootState } from "./store";

export function initListenerMiddleware(props: { extra: ReduxExtraArgument }) {
  const {
    extra,
    extra: { vault, metadataCache, indexServices, icalParseScheduler },
  } = props;

  const listenerMiddleware = createListenerMiddleware<
    RootState,
    AppDispatch,
    ReduxExtraArgument
  >({
    extra,
  });

  listenerMiddleware.startListening({
    actionCreator: icalRefreshRequested,
    effect: createIcalFetchListener({ fetcher: createCachingFetcher() }),
  });

  listenerMiddleware.startListening({
    predicate: (action, currentState) =>
      checkIcalEventsChanged(action, currentState) ||
      checkVisibleDaysChanged(action, currentState),
    effect: createIcalParseListener({
      scheduler: icalParseScheduler,
    }),
  });

  listenerMiddleware.startListening({
    actionCreator: indexRequested,
    effect: createIndexListener({
      vault,
      metadataCache,
      indexServices,
    }),
  });

  return listenerMiddleware;
}
