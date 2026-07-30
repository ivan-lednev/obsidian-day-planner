import type { Moment } from "moment";
import type { Readable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { getId } from "../util/id";
import { getDayKey } from "../util/time-block-utils";

import {
  rangeTracked,
  rangeUntracked,
  rangeUpdated,
  selectDaysForRange,
} from "./date-ranges-slice";
import type { AppStore, RootState } from "./store";
import type { UseSelector } from "./use-selector";

export type DateRange = {
  readonly current: Moment[];
  /**
   * A tracked range always holds at least one day, so these skip the null-checks
   * that reading `current` by index would need
   */
  readonly first: Moment;
  readonly last: Moment;
  set: (days: Moment[]) => void;
  update: (fn: (days: Moment[]) => Moment[]) => void;
  untrack: () => void;
};

export function createDateRanges(props: {
  store: AppStore;
  useSelector: UseSelector<RootState>;
}) {
  const { store, useSelector } = props;

  function trackRange(initial: Moment[]): DateRange {
    const id = getId();

    store.dispatch(rangeTracked({ id, dayKeys: initial.map(getDayKey) }));

    const days = useSelector((state) => selectDaysForRange(state, id));

    function set(nextDays: Moment[]) {
      store.dispatch(rangeUpdated({ id, dayKeys: nextDays.map(getDayKey) }));
    }

    return {
      get current() {
        return days.current;
      },
      get first() {
        const first = days.current[0];

        isNotVoid(first, "Date range is empty");

        return first;
      },
      get last() {
        const last = days.current.at(-1);

        isNotVoid(last, "Date range is empty");

        return last;
      },
      set,
      update(fn: (days: Moment[]) => Moment[]) {
        set(fn(days.current));
      },
      untrack() {
        store.dispatch(rangeUntracked({ id }));
      },
    };
  }

  return { trackRange };
}

export type DateRanges = ReturnType<typeof createDateRanges>;

export function keepRangeOnToday(
  dateRange: DateRange,
  currentTime: Readable<Moment>,
) {
  return currentTime.subscribe((now) => {
    const trackedDay = dateRange.current[0];

    if (trackedDay && !trackedDay.isSame(now, "day")) {
      dateRange.set([now]);
    }
  });
}
