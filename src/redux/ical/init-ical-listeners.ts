import { request } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { RemoteTimeBlock, WithDuration } from "../../time-block-types";
import { canHappenAfter, icalEventToTimeBlocksForRange } from "../../util/ical";
import { type Scheduler } from "../../util/scheduler";
import { selectSortedDedupedVisibleDays } from "../date-ranges-slice";
import { selectIcals } from "../settings-slice";
import type { AppListenerEffect } from "../store";

import {
  icalsFetched,
  remoteTimeBlocksUpdated,
  selectAllIcalEventsWithIcalConfigs,
} from "./ical-slice";

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

export type IcalParseTaskResult =
  | RemoteTimeBlock
  | RemoteTimeBlock[]
  | undefined;

export function createIcalParseListener(props: {
  scheduler: Scheduler<IcalParseTaskResult>;
}): AppListenerEffect {
  const { scheduler } = props;

  return async (action, listenerApi) => {
    const icalEvents = selectAllIcalEventsWithIcalConfigs(
      listenerApi.getState(),
    );

    if (icalEvents.length === 0) {
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

    const timeBlockComputationQueue = relevantIcalEvents.flatMap(
      (icalEvent) => () =>
        icalEventToTimeBlocksForRange(icalEvent, earliestDay, latestDay),
    );

    scheduler.enqueueTasks(
      timeBlockComputationQueue,
      (timeBlocksFromEvents) => {
        const remoteTimeBlocks = timeBlocksFromEvents
          .flat()
          .filter(
            (
              timeBlock,
            ): timeBlock is RemoteTimeBlock | WithDuration<RemoteTimeBlock> =>
              Boolean(timeBlock),
          )
          // todo: t.serialize(), t.deserialize()
          .map((it) => ({ ...it, startTime: it.startTime.toISOString() }));

        listenerApi.dispatch(remoteTimeBlocksUpdated(remoteTimeBlocks));
      },
    );
  };
}
