import { createListenerMiddleware } from "@reduxjs/toolkit";

import { icalParseLowerLimit } from "../constants";
import type { ReduxExtraArgument } from "../types";
import { createBackgroundBatchScheduler } from "../util/scheduler";

import { dataviewChange } from "./dataview/dataview-slice";
import { createListPropsParseListener } from "./dataview/init-dataview-listeners";
import { icalRefreshRequested, icalsFetched } from "./ical/ical-slice";
import {
  checkIcalEventsChanged,
  checkVisibleDaysChanged,
  createCachingFetcher,
  createIcalFetchListener,
  createIcalParseListener,
  type IcalParseTaskResult,
} from "./ical/init-ical-listeners";
import type { AppDispatch, RootState } from "./store";

export function initListenerMiddleware(props: { extra: ReduxExtraArgument }) {
  const {
    extra,
    extra: { listPropsParser },
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
    actionCreator: icalsFetched,
    effect: async (action, listenerApi) => {
      await listenerApi.extra.onIcalsFetched(action.payload);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: dataviewChange,
    effect: createListPropsParseListener({ listPropsParser }),
  });

  return listenerMiddleware;
}
