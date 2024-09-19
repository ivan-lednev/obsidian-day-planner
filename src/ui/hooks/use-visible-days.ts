import { isEqual, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, type Readable } from "svelte/store";

import { getDayKey } from "../../util/tasks-utils";

export function useVisibleDays(
  ranges: Readable<Record<string, Array<Moment>>>,
) {
  let previousDayKeys: string[];

  return derived(ranges, ($ranges, set: (days: Moment[]) => void) => {
    const days = Object.values($ranges).flat();
    const uniqDays = uniqBy(getDayKey, days);
    const dayKeys = uniqDays.map(getDayKey).sort();
    const areDaysSame = previousDayKeys && isEqual(dayKeys, previousDayKeys);

    if (!areDaysSame) {
      previousDayKeys = dayKeys;
      set(uniqDays);
    }
  });
}
