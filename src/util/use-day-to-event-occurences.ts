import {
  filter,
  flatten,
  flow,
  groupBy,
  isEmpty,
  mapValues,
  partition,
} from "lodash/fp";
import type { Moment } from "moment";
import ical from "node-ical";
import { request } from "obsidian";
import { derived, readable, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";
import type { RemoteTask, WithTime } from "../task-types";
import type { WithIcalConfig } from "../types";

import { canHappenAfter, icalEventToTasks } from "./ical";
import { getEarliestMoment } from "./moment";
import { createBackgroundBatchScheduler } from "./scheduler";
import { getDayKey } from "./tasks-utils";

function isVEvent(event: ical.CalendarComponent): event is ical.VEvent {
  return event.type === "VEVENT";
}

export function useDayToEventOccurences(props: {
  settings: Readable<DayPlannerSettings>;
  syncTrigger: Readable<unknown>;
  isOnline: Readable<boolean>;
  visibleDays: Readable<Moment[]>;
}) {
  const { settings, syncTrigger, isOnline, visibleDays } = props;

  const previousFetches = new Map<string, Array<WithIcalConfig<ical.VEvent>>>();
  const icals = derived(settings, ($settings) => $settings.icals);

  const icalEvents = derived(
    [icals, isOnline, syncTrigger],
    (
      [$icals, $isOnline],
      set: (events: Array<WithIcalConfig<ical.VEvent>>) => void,
    ) => {
      if (!$isOnline) {
        return;
      }

      const calendarPromises = $icals
        .filter((ical) => ical.url.trim().length > 0)
        .map((calendar) =>
          request({
            url: calendar.url,
          })
            .then((response) => {
              const parsed = ical.parseICS(response);
              const veventsWithCalendar = Object.values(parsed)
                .filter(isVEvent)
                .map((icalEvent) => ({
                  ...icalEvent,
                  calendar,
                }));

              previousFetches.set(calendar.url, veventsWithCalendar);

              return veventsWithCalendar;
            })
            .catch((error) => {
              console.error(error);

              return previousFetches.get(calendar.url) || [];
            }),
        );

      Promise.all(calendarPromises).then((calendars) => {
        const allEvents = calendars.flat();

        set(allEvents);
      });
    },
  );

  const schedulerQueue = derived(
    [icalEvents, visibleDays],
    ([$icalEvents, $visibleDays]) => {
      if (isEmpty($icalEvents) || isEmpty($visibleDays)) {
        return [];
      }

      const earliestDay = getEarliestMoment($visibleDays);
      const startOfEarliestDay = earliestDay.clone().startOf("day").toDate();
      const relevantIcalEvents = $icalEvents.filter((icalEvent) =>
        canHappenAfter(icalEvent, startOfEarliestDay),
      );

      return relevantIcalEvents.flatMap((icalEvent) => {
        return $visibleDays.map(
          (day) => () => icalEventToTasks(icalEvent, day),
        );
      });
    },
  );

  const tasksFromEvents = readable<Array<ReturnType<typeof icalEventToTasks>>>(
    [],
    (set) => {
      const scheduler =
        createBackgroundBatchScheduler<ReturnType<typeof icalEventToTasks>>(
          set,
        );

      return schedulerQueue.subscribe(scheduler.enqueueTasks);
    },
  );

  return derived(
    tasksFromEvents,
    flow(
      filter(Boolean),
      flatten,
      groupBy((task: WithTime<RemoteTask>) => getDayKey(task.startTime)),
      mapValues((tasks) => {
        const [withTime, noTime]: [
          Array<WithTime<RemoteTask>>,
          Array<Omit<WithTime<RemoteTask>, "startMinutes">>,
        ] = partition((task) => task.startMinutes !== undefined, tasks);

        return { withTime, noTime };
      }),
    ),
  );
}
