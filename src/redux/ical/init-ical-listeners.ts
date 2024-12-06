import { isEmpty } from "lodash/fp";
import ical from "node-ical";
import { request } from "obsidian";

import type { IcalConfig } from "../../settings";
import type { RemoteTask, WithTime } from "../../task-types";
import type { WithIcalConfig } from "../../types";
import { canHappenAfter, icalEventToTasks } from "../../util/ical";
import { getEarliestMoment } from "../../util/moment";
import { createBackgroundBatchScheduler } from "../../util/scheduler";
import { isVEvent } from "../../util/use-remote-tasks";
import { selectVisibleDays } from "../global-slice";
import { selectIcals } from "../settings-slice";
import type { StartListeningFn } from "../store";
import { createSelectorChangePredicate } from "../util";

import {
  icalListenerStarted,
  icalRefreshRequested,
  icalsFetched,
  remoteTasksUpdated,
  selectIcalEvents,
} from "./ical-slice";

const icalParseLowerLimit = 10;

const checkVisibleDaysChanged =
  createSelectorChangePredicate(selectVisibleDays);
const checkIcalEventsChanged = createSelectorChangePredicate(selectIcalEvents);

function createCachingFetcher() {
  const previousFetches = new Map<string, string>();

  return async (url: string) => {
    // try {
    const response = await request({ url });

    previousFetches.set(url, response);

    return response;
    // } catch {
    //   const fallback = previousFetches.get(icalConfig.url) || "";
    //
    //   return { icalConfig, text: fallback };
    // }
  };
}

export function initIcalListeners(startListening: StartListeningFn) {
  startListening({
    actionCreator: icalListenerStarted,
    effect: async (action, listenerApi) => {
      listenerApi.unsubscribe();

      const fetcher = createCachingFetcher();

      while (true) {
        const [, currentState] = await listenerApi.take(
          icalRefreshRequested.match,
        );

        const icalConfigs = selectIcals(currentState).filter(
          (ical) => ical.url.trim().length > 0,
        );

        const fetched = await Promise.all(
          icalConfigs.map(async (icalConfig) => ({
            icalConfig,
            text: await fetcher(icalConfig.url),
          })),
        );

        listenerApi.dispatch(icalsFetched(fetched));
      }
    },
  });

  startListening({
    actionCreator: icalListenerStarted,
    effect: async (action, listenerApi) => {
      listenerApi.unsubscribe();

      const scheduler = createBackgroundBatchScheduler({
        timeRemainingLowerLimit: icalParseLowerLimit,
      });

      while (true) {
        const [, currentState] = await listenerApi.take(
          (action, currentState) =>
            checkIcalEventsChanged(action, currentState) ||
            checkVisibleDaysChanged(action, currentState),
        );

        const icalEvents = selectIcalEvents(currentState);
        const visibleDays = selectVisibleDays(currentState);

        if (isEmpty(icalEvents) || isEmpty(visibleDays)) {
          continue;
        }

        const earliestDay = getEarliestMoment(visibleDays);
        const startOfEarliestDay = earliestDay.clone().startOf("day").toDate();
        const relevantIcalEvents = icalEvents.filter((icalEvent) =>
          canHappenAfter(icalEvent, startOfEarliestDay),
        );

        const queue = relevantIcalEvents.flatMap((icalEvent) =>
          visibleDays.map((day) => () => icalEventToTasks(icalEvent, day)),
        );

        scheduler.enqueueTasks(queue, (tasksFromEvents) => {
          const remoteTasks = tasksFromEvents
            .flat()
            .filter((task): task is RemoteTask | WithTime<RemoteTask> =>
              Boolean(task),
            )
            .map((it) => ({ ...it, startTime: it.startTime.toISOString() }));

          listenerApi.dispatch(remoteTasksUpdated(remoteTasks));
        });
      }
    },
  });
}
