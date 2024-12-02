import ical from "node-ical";
import { request } from "obsidian";

import {
  icalEventsUpdated,
  icalListenerStarted,
  icalRefreshRequested,
} from "./ical-slice";
import type { IcalConfig } from "./settings";
import { selectIcals } from "./settings-slice";
import type { StartListeningFn } from "./store";
import type { WithIcalConfig } from "./types";
import { isVEvent } from "./util/use-remote-tasks";

function createCachingFetcher() {
  const previousFetches = new Map<string, Array<WithIcalConfig<ical.VEvent>>>();

  return async (calendar: IcalConfig) => {
    try {
      const response = await request({
        url: calendar.url,
      });

      const parsed = ical.parseICS(response);
      const veventsWithCalendar = Object.values(parsed)
        .filter(isVEvent)
        .map((icalEvent) => ({
          ...icalEvent,
          calendar,
        }));

      previousFetches.set(calendar.url, veventsWithCalendar);

      return veventsWithCalendar;
    } catch {
      return previousFetches.get(calendar.url) || [];
    }
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

        const icals = selectIcals(currentState).filter(
          (ical) => ical.url.trim().length > 0,
        );

        const allEvents = await Promise.all(icals.map(fetcher));

        listenerApi.dispatch(icalEventsUpdated(allEvents.flat()));
      }
    },
  });
}
