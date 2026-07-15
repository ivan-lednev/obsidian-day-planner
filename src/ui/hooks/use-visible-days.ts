import { Array, Equivalence } from "effect";
import type { Moment } from "moment";
import { derived, type Readable } from "svelte/store";

import { getDayKey } from "../../util/time-block-utils";

const areDayKeysEqual = Array.getEquivalence(Equivalence.string);

export function useVisibleDays(
  ranges: Readable<Record<string, Array<Moment>>>,
) {
  let previousDayKeys: string[];

  return derived(ranges, ($ranges, set: (days: Moment[]) => void) => {
    const days = Object.values($ranges).flat();
    const uniqDays = Array.dedupeWith(
      days,
      (a, b) => getDayKey(a) === getDayKey(b),
    );
    const dayKeys = uniqDays.map(getDayKey).sort();
    const areDaysSame =
      previousDayKeys && areDayKeysEqual(dayKeys, previousDayKeys);

    if (!areDaysSame) {
      previousDayKeys = dayKeys;
      set(uniqDays);
    }
  });
}
