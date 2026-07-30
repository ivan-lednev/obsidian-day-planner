import { createListenerMiddleware } from "@reduxjs/toolkit";
import { flushSync } from "svelte";
import { writable } from "svelte/store";
import { describe, expect, test } from "vitest";

import {
  selectSortedDedupedVisibleDays,
  selectVisibleDays,
} from "../src/redux/date-ranges-slice";
import {
  makeStore,
  type AppDispatch,
  type RootState,
} from "../src/redux/store";
import { createUseSelector } from "../src/redux/use-selector";
import type { ReduxExtraArgument } from "../src/types";
import {
  keepRangeOnToday,
  useDateRanges,
} from "../src/ui/hooks/use-date-ranges";

function setUp() {
  const listenerMiddleware = createListenerMiddleware<
    RootState,
    AppDispatch,
    ReduxExtraArgument
  >();
  const store = makeStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  });
  const useSelector = createUseSelector<RootState>(store);

  return {
    store,
    dateRanges: useDateRanges({ store, useSelector, listenerMiddleware }),
  };
}

describe("date ranges", () => {
  test("tracked ranges show up in visible days, deduped and sorted", () => {
    const { store, dateRanges } = setUp();

    dateRanges.trackRange([window.moment("2025-07-30")]);
    dateRanges.trackRange([
      window.moment("2025-07-31"),
      window.moment("2025-07-30"),
    ]);

    expect(selectVisibleDays(store.getState())).toEqual([
      "2025-07-30",
      "2025-07-31",
    ]);
  });

  test("a range reads back its days", () => {
    const { dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);

    expect(range.current).toEqual([window.moment("2025-07-30")]);

    range.set([window.moment("2025-08-01")]);

    expect(range.current).toEqual([window.moment("2025-08-01")]);
  });

  test("update receives the current days", () => {
    const { dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);

    range.update((days) => days.map((it) => it.clone().add(1, "day")));

    expect(range.current).toEqual([window.moment("2025-07-31")]);
  });

  test("days of a range keep referential identity when another range changes", () => {
    const { dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);
    const before = range.current;

    dateRanges.trackRange([window.moment("2025-08-05")]);

    expect(range.current).toBe(before);
  });

  test("effects of one range do not re-run when another range changes", () => {
    const { dateRanges } = setUp();

    const rangeA = dateRanges.trackRange([window.moment("2025-07-30")]);
    const rangeB = dateRanges.trackRange([window.moment("2025-07-30")]);

    let runsForA = 0;
    let runsForB = 0;

    $effect.root(() => {
      $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        rangeA.current;
        runsForA++;
      });

      $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        rangeB.current;
        runsForB++;
      });

      flushSync();

      expect(runsForA).toBe(1);
      expect(runsForB).toBe(1);

      rangeB.set([window.moment("2025-08-01")]);
      flushSync();

      expect(runsForA).toBe(1);
      expect(runsForB).toBe(2);
    });
  });

  test("setting the same days does not re-run effects", () => {
    const { dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);

    let runs = 0;

    $effect.root(() => {
      $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        range.current;
        runs++;
      });

      flushSync();

      expect(runs).toBe(1);

      range.set([window.moment("2025-07-30")]);
      flushSync();

      expect(runs).toBe(1);
    });
  });

  test("set after untrack does not resurrect the range", () => {
    const { store, dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);

    range.untrack();
    range.set([window.moment("2025-08-01")]);

    expect(selectVisibleDays(store.getState())).toEqual([]);
    expect(range.current).toEqual([]);
  });

  test("visible days keep referential identity when the set of days does not change", () => {
    const { store, dateRanges } = setUp();

    dateRanges.trackRange([window.moment("2025-07-30")]);

    const before = selectVisibleDays(store.getState());

    const duplicate = dateRanges.trackRange([window.moment("2025-07-30")]);

    expect(selectVisibleDays(store.getState())).toBe(before);

    duplicate.untrack();

    expect(selectVisibleDays(store.getState())).toBe(before);
  });

  test("sorted deduped visible days are moments at local midnight", () => {
    const { store, dateRanges } = setUp();

    dateRanges.trackRange([window.moment("2025-07-30")]);

    expect(selectSortedDedupedVisibleDays(store.getState())).toEqual([
      window.moment("2025-07-30").startOf("day"),
    ]);
  });

  test("onChange only reacts to this range, and stops after unsubscribing", () => {
    const { dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);

    let runs = 0;
    const unsubscribe = range.onChange(() => {
      runs++;
    });

    range.set([window.moment("2025-07-31")]);

    expect(runs).toBe(1);
    expect(range.current).toEqual([window.moment("2025-07-31")]);

    const other = dateRanges.trackRange([window.moment("2025-09-01")]);

    other.set([window.moment("2025-09-02")]);

    expect(runs).toBe(1);

    range.set([window.moment("2025-07-31")]);

    expect(runs).toBe(1);

    unsubscribe();

    range.set([window.moment("2025-08-01")]);

    expect(runs).toBe(1);
  });

  test("keepRangeOnToday moves the range to the new day after midnight", () => {
    const { dateRanges } = setUp();

    const range = dateRanges.trackRange([window.moment("2025-07-30")]);
    const currentTime = writable(window.moment("2025-07-30T23:59:00"));

    const unsubscribe = keepRangeOnToday(range, currentTime);

    currentTime.set(window.moment("2025-07-30T23:59:30"));

    expect(range.current).toEqual([window.moment("2025-07-30")]);

    currentTime.set(window.moment("2025-07-31T00:00:15"));

    expect(range.current).toEqual([window.moment("2025-07-31")]);

    unsubscribe();

    currentTime.set(window.moment("2025-08-01T00:00:15"));

    expect(range.current).toEqual([window.moment("2025-07-31")]);
  });
});
