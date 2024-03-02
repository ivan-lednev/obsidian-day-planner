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
        $settings.icalUrls.map((url) =>
          request({
            url,
          })
            .then((response) => {
              const parsed = ical.parseICS(response);

              return Object.values(parsed).filter(isVEvent);
            })
            .catch((error) => {
              // todo: handle errors: collect them, don't stop filtering because of a single error
              new Notice(error);
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
