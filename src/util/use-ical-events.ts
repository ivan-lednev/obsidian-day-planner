import ical from "node-ical";
import { Notice, request } from "obsidian";
import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../settings";

function isVEvent(event: ical.CalendarComponent): event is ical.VEvent {
  return event.type === "VEVENT";
}

export function useIcalEvents(
  settings: Readable<DayPlannerSettings>,
  syncTrigger: Readable<unknown>,
) {
  // todo: [minor] derive only from relevant setting
  return derived(
    [settings, syncTrigger],
    ([$settings], set: (events: ical.VEvent[]) => void) => {
      const allCalendarsParsed = Promise.all(
        $settings.icals
          .filter((ical) => ical.url.trim().length > 0)
          .map(({ name, url }) =>
            request({
              url,
            })
              .then((response) => {
                const parsed = ical.parseICS(response);
                const icalEvents = Object.values(parsed).filter(isVEvent);

                icalEvents.forEach((icalEvent) => {
                  // @ts-ignore
                  icalEvent.calendar = name;
                });

                return icalEvents;
              })
              .catch((error) => {
                new Notice(
                  `See console for details. Could not fetch calendar from ${url}`,
                );
                console.error(error);

                return [];
              }),
          ),
      );

      allCalendarsParsed.then((calendars) => {
        const allEvents = calendars.flat();
        // window.allEvents = allEvents;

        set(allEvents);
      });
    },
  );
}
