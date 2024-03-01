import ical from "node-ical";
import { Notice, request } from "obsidian";
import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../settings";

import { withPerformanceReport } from "./performance";

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
      request({
        url: $settings.icalUrls[0],
      })
        .then((response) => {
          const parsed = withPerformanceReport(() => ical.parseICS(response), {
            op: "parseICS",
          });
          const events = Object.values(parsed).filter(isVEvent);

          set(events);
        })
        .catch((error) => {
          // todo: handle errors: collect them, don't stop filtering because of a single error
          new Notice(error);
          console.error(error);
        });
    },
  );
}
