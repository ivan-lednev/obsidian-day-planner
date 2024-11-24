import { isEmpty } from "lodash/fp";
import type { Moment } from "moment";
import ical from "node-ical";
import { request } from "obsidian";
import { derived, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";
import type { RemoteTask, WithTime } from "../task-types";
import type { WithIcalConfig } from "../types";
import { useIdleDerived } from "../ui/hooks/use-idle-derived";

import { canHappenAfter, icalEventToTasks } from "./ical";
import { getEarliestMoment } from "./moment";

function isVEvent(event: ical.CalendarComponent): event is ical.VEvent {
  return event.type === "VEVENT";
}

export function useRemoteTasks(props: {
  settings: Readable<DayPlannerSettings>;
  refreshSignal: Readable<unknown>;
  isOnline: Readable<boolean>;
  visibleDays: Readable<Moment[]>;
}) {
  const { settings, refreshSignal, isOnline, visibleDays } = props;

  const previousFetches = new Map<string, Array<WithIcalConfig<ical.VEvent>>>();
  const icals = derived(settings, ($settings) => $settings.icals);

  const icalEvents = derived(
    [icals, isOnline, refreshSignal],
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
            .catch(() => {
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

  const tasksFromEvents = useIdleDerived({
    batch: schedulerQueue,
    timeRemainingLowerLimit: 10,
    initial: [],
  });

  return derived(tasksFromEvents, ($tasksFromEvents) =>
    $tasksFromEvents
      .flat()
      .filter((task): task is RemoteTask | WithTime<RemoteTask> =>
        Boolean(task),
      ),
  );
}
