import { createListenerMiddleware } from "@reduxjs/toolkit";

import { icalParseLowerLimit } from "../constants";
import type { ReduxExtraArgument } from "../types";
import { createBackgroundBatchScheduler } from "../util/scheduler";

import { icalRefreshRequested } from "./ical/ical-slice";
import {
  checkIcalEventsChanged,
  checkVisibleDaysChanged,
  createCachingFetcher,
  createIcalFetchListener,
  createIcalParseListener,
  type IcalParseTaskResult,
} from "./ical/init-ical-listeners";
import type { AppDispatch, RootState } from "./store";
import { createIndexListener, indexRequested } from "./tracker/tracker-slice";

export function initListenerMiddleware(props: { extra: ReduxExtraArgument }) {
  const {
    extra,
    extra: { listPropsParser, vault, metadataCache, periodicNotes },
  } = props;

  const icalParseScheduler =
    createBackgroundBatchScheduler<IcalParseTaskResult>({
      timeRemainingLowerLimit: icalParseLowerLimit,
    });

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
      listPropsParser,
      vault,
      metadataCache,
      periodicNotes,
    }),
  });

  return listenerMiddleware;
}
