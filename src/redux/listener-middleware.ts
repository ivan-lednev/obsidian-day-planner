import { createListenerMiddleware } from "@reduxjs/toolkit";

import { icalParseLowerLimit } from "../constants";
import type { ReduxExtraArgument } from "../types";
import { createBackgroundBatchScheduler } from "../util/scheduler";

import {
  icalRefreshRequested,
  icalsFetched,
  type RawIcal,
} from "./ical/ical-slice";
import {
  checkIcalEventsChanged,
  checkVisibleDaysChanged,
  createCachingFetcher,
  createIcalFetchListener,
  createIcalParseListener,
  type IcalParseTaskResult,
} from "./ical/init-ical-listeners";
import type { AppDispatch, RootState } from "./store";

export function initListenerMiddleware(props: {
  extra: ReduxExtraArgument;
  onIcalsFetched: (rawIcals: RawIcal[]) => Promise<void>;
}) {
  const { extra, onIcalsFetched } = props;

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

  const icalParseScheduler =
    createBackgroundBatchScheduler<IcalParseTaskResult>({
      timeRemainingLowerLimit: icalParseLowerLimit,
    });

  const icalParseListener = createIcalParseListener({
    scheduler: icalParseScheduler,
  });

  listenerMiddleware.startListening({
    predicate: (action, currentState) =>
      checkIcalEventsChanged(action, currentState) ||
      checkVisibleDaysChanged(action, currentState),
    effect: icalParseListener,
  });

  listenerMiddleware.startListening({
    actionCreator: icalsFetched,
    effect: async (action) => {
      await onIcalsFetched(action.payload);
    },
  });

  return listenerMiddleware;
}
