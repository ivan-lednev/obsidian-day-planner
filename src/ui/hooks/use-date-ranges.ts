import type { Moment } from "moment";
import type { Readable } from "svelte/store";

import {
  rangeTracked,
  rangeUntracked,
  rangeUpdated,
  selectDayKeysForRange,
  selectDaysForRange,
} from "../../redux/date-ranges-slice";
import type {
  AppListenerMiddlewareInstance,
  AppStore,
  RootState,
} from "../../redux/store";
import type { UseSelector } from "../../redux/use-selector";
import { createSelectorChangePredicate } from "../../redux/util";
import type { DateRange } from "../../types";
import { getId } from "../../util/id";
import { getDayKey } from "../../util/time-block-utils";

export function useDateRanges(props: {
  store: AppStore;
  useSelector: UseSelector<RootState>;
  listenerMiddleware: AppListenerMiddlewareInstance;
}) {
  const { store, useSelector, listenerMiddleware } = props;

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
      set,
      update(fn: (days: Moment[]) => Moment[]) {
        set(fn(days.current));
      },
      onChange(listener: () => void) {
        return listenerMiddleware.startListening({
          predicate: createSelectorChangePredicate((state: RootState) =>
            selectDayKeysForRange(state, id),
          ),
          effect: listener,
        });
      },
      untrack() {
        store.dispatch(rangeUntracked({ id }));
      },
    };
  }

  return { trackRange };
}

export type DateRanges = ReturnType<typeof useDateRanges>;

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
