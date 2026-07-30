import { createListenerMiddleware } from "@reduxjs/toolkit";

import type { ReduxExtraArgument } from "../types";

import { selectVisibleDays } from "./date-ranges-slice";
import {
  icalRefreshRequested,
  selectAllIcalEventsWithIcalConfigs,
} from "./ical/ical-slice";
import {
  createCachingFetcher,
  createIcalFetchListener,
  createIcalParseListener,
} from "./ical/init-ical-listeners";
import { createIndexListener, indexRequested } from "./index/index-slice";
import type { AppDispatch, RootState } from "./store";
import { createSelectorChangePredicate } from "./util";

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

  // Change predicates record what they saw, so every listener needs its own
  const checkIcalEventsChanged = createSelectorChangePredicate(
    selectAllIcalEventsWithIcalConfigs,
  );
  const checkVisibleDaysChanged =
    createSelectorChangePredicate(selectVisibleDays);

  listenerMiddleware.startListening({
    // Both predicates have to run on every action, so no short-circuiting here
    predicate: (action, currentState) => {
      const icalEventsChanged = checkIcalEventsChanged(action, currentState);
      const visibleDaysChanged = checkVisibleDaysChanged(action, currentState);

      return icalEventsChanged || visibleDaysChanged;
    },
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
