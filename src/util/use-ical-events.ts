import ical from "node-ical";
import { Notice, request } from "obsidian";
import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../settings";
import { WithIcalConfig } from "../types";

function isVEvent(event: ical.CalendarComponent): event is ical.VEvent {
  return event.type === "VEVENT";
}

export function useIcalEvents(
  settings: Readable<DayPlannerSettings>,
  syncTrigger: Readable<unknown>,
  isOnline: Readable<boolean>,
) {
  // todo: [minor] derive only from relevant setting
  return derived(
    [settings, isOnline, syncTrigger],
    (
      [$settings, $isOnline],
      set: (events: Array<WithIcalConfig<ical.VEvent>>) => void,
    ) => {
      if (!$isOnline) {
        return;
      }

      const allCalendarsParsed = Promise.all(
        $settings.icals
          .filter((ical) => ical.url.trim().length > 0)
          .map((calendar) =>
            request({
              url: calendar.url,
            })
              .then((response) => {
                const parsed = ical.parseICS(response);

                return Object.values(parsed)
                  .filter(isVEvent)
                  .map((icalEvent) => ({
                    ...icalEvent,
                    calendar,
                  }));
              })
              .catch((error) => {
                new Notice(
                  `See console for details. Could not fetch calendar from ${calendar.url}`,
                );
                console.error(error);

                return [];
              }),
          ),
      );

      allCalendarsParsed.then((calendars) => {
        const allEvents = calendars.flat();

        set(allEvents);
      });
    },
  );
}
