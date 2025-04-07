import { isEmpty } from "lodash/fp";
import { request } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { RemoteTask, WithTime } from "../../task-types";
import { canHappenAfter, icalEventToTasksForRange } from "../../util/ical";
import { type Scheduler } from "../../util/scheduler";
import {
  selectSortedDedupedVisibleDays,
  selectVisibleDays,
} from "../global-slice";
import { selectIcals } from "../settings-slice";
import type { AppListenerEffect } from "../store";
import { createSelectorChangePredicate } from "../util";

import {
  icalsFetched,
  remoteTasksUpdated,
  selectAllIcalEventsWithIcalConfigs,
} from "./ical-slice";

export const checkVisibleDaysChanged =
  createSelectorChangePredicate(selectVisibleDays);
export const checkIcalEventsChanged = createSelectorChangePredicate(
  selectAllIcalEventsWithIcalConfigs,
);

export function createCachingFetcher() {
  const previousFetches = new Map<string, string>();

  return async (url: string) => {
    try {
      const response = await request({ url });

      previousFetches.set(url, response);

      return response;
    } catch {
      return previousFetches.get(url) || "";
    }
  };
}

export function createIcalFetchListener(props: {
  fetcher: (url: string) => Promise<string>;
}): AppListenerEffect {
  const { fetcher } = props;

  return async (action, listenerApi) => {
    const icalConfigs = selectIcals(listenerApi.getState()).filter(
      (ical) => ical.url.trim().length > 0,
    );

    const fetched = await Promise.all(
      icalConfigs.map(async (icalConfig) => ({
        icalConfig,
        text: await fetcher(icalConfig.url),
      })),
    );

    listenerApi.dispatch(icalsFetched(fetched));
  };
}

export type IcalParseTaskResult = RemoteTask | RemoteTask[] | undefined;

export function createIcalParseListener(props: {
  scheduler: Scheduler<IcalParseTaskResult>;
}): AppListenerEffect {
  const { scheduler } = props;

  return async (action, listenerApi) => {
    const icalEvents = selectAllIcalEventsWithIcalConfigs(
      listenerApi.getState(),
    );

    if (isEmpty(icalEvents)) {
      return;
    }

    const visibleDays = selectSortedDedupedVisibleDays(listenerApi.getState());

    if (visibleDays.length === 0) {
      return;
    }

    const earliestDay = visibleDays.at(0);
    const latestDay = visibleDays.at(-1);

    isNotVoid(earliestDay);
    isNotVoid(latestDay);

    const startOfEarliestDay = earliestDay.clone().startOf("day").toDate();

    const relevantIcalEvents = icalEvents.filter((icalEvent) =>
      canHappenAfter(icalEvent, startOfEarliestDay),
    );

    const taskComputationQueue = relevantIcalEvents.flatMap(
      (icalEvent) => () =>
        icalEventToTasksForRange(icalEvent, earliestDay, latestDay),
    );

    scheduler.enqueueTasks(taskComputationQueue, (tasksFromEvents) => {
      const remoteTasks = tasksFromEvents
        .flat()
        .filter((task): task is RemoteTask | WithTime<RemoteTask> =>
          Boolean(task),
        )
        // todo: t.serialize(), t.deserialize()
        .map((it) => ({ ...it, startTime: it.startTime.toISOString() }));

      listenerApi.dispatch(remoteTasksUpdated(remoteTasks));
    });
  };
}
