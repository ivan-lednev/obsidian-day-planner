import { derived } from "svelte/store";

import { visibleDateRange } from "./visible-date-range";
import { visibleDayInTimeline } from "./visible-day-in-timeline";

export const visibleDays = derived(
  [visibleDayInTimeline, visibleDateRange],
  ([$visibleDayInTimeline, $visibleDateRange]) => {
    return [
      $visibleDayInTimeline,
      ...$visibleDateRange.filter(
        (day) => !$visibleDayInTimeline.isSame(day, "day"),
      ),
    ];
  },
);
