import { isEqual, uniqBy } from "lodash/fp";
import { Moment } from "moment";
import { derived } from "svelte/store";

import { getDayKey } from "../util/tasks-utils";

import { currentTime } from "./current-time";
import { visibleDateRange } from "./visible-date-range";
import { visibleDayInTimeline } from "./visible-day-in-timeline";

function useVisibleDays() {
  let previousDayKeys: string[];

  return derived(
    [visibleDayInTimeline, visibleDateRange, currentTime],
    (
      [$visibleDayInTimeline, $visibleDateRange, $currentTime],
      set: (days: Moment[]) => void,
    ) => {
      const days = [$currentTime, $visibleDayInTimeline, ...$visibleDateRange];
      const uniqDays = uniqBy(getDayKey, days);
      const dayKeys = uniqDays.map(getDayKey).sort();
      const areDaysSame = previousDayKeys && isEqual(dayKeys, previousDayKeys);

      if (!areDaysSame) {
        previousDayKeys = dayKeys;
        set(uniqDays);
      }
    },
  );
}

export const visibleDays = useVisibleDays();
