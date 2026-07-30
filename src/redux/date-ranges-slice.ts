import {
  createSelector,
  lruMemoize,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { Array, Equivalence } from "effect";

import { defaultDayFormat } from "../constants";

import { createAppSlice } from "./create-app-slice";

const areDayKeysEqual = Array.getEquivalence(Equivalence.string);

interface DateRangesSliceState {
  /**
   * Day keys are formatted in the local time zone. Formatting in UTC would
   * shift days for users east of UTC: their 2025-04-15 is 2025-04-14T22:00:00Z.
   */
  ranges: Record<string, string[]>;
}

export const initialState: DateRangesSliceState = {
  ranges: {},
};

export const dateRangesSlice = createAppSlice({
  name: "dateRanges",
  initialState,
  reducers: (create) => ({
    rangeTracked: create.reducer(
      (state, action: PayloadAction<{ id: string; dayKeys: string[] }>) => {
        state.ranges[action.payload.id] = action.payload.dayKeys;
      },
    ),
    rangeUpdated: create.reducer(
      (state, action: PayloadAction<{ id: string; dayKeys: string[] }>) => {
        const { id, dayKeys } = action.payload;
        const current = state.ranges[id];

        if (current && !areDayKeysEqual(current, dayKeys)) {
          state.ranges[id] = dayKeys;
        }
      },
    ),
    rangeUntracked: create.reducer(
      (state, action: PayloadAction<{ id: string }>) => {
        delete state.ranges[action.payload.id];
      },
    ),
  }),
  selectors: {
    selectRanges: (state) => state.ranges,
    selectDayKeysForRange: (state, id: string) => state.ranges[id],
  },
});

export const { rangeTracked, rangeUpdated, rangeUntracked } =
  dateRangesSlice.actions;

export const { selectRanges, selectDayKeysForRange } =
  dateRangesSlice.selectors;

/**
 * Immer preserves references of untouched ranges, so the memoized result stays
 * referentially stable while this range's day keys do not change
 */
export const selectDaysForRange = createSelector(
  selectDayKeysForRange,
  (dayKeys = []) => dayKeys.map((it) => window.moment(it, defaultDayFormat)),
);

export const selectVisibleDays = createSelector(
  selectRanges,
  (ranges) => [...new Set(Object.values(ranges).flat())].sort(),
  {
    memoize: lruMemoize,
    // Tracking or untracking a range often leaves the set of visible days
    // unchanged. Keeping the previous reference in that case prevents
    // downstream selectors and change predicates from re-firing
    memoizeOptions: { resultEqualityCheck: areDayKeysEqual },
  },
);

export const selectSortedDedupedVisibleDays = createSelector(
  selectVisibleDays,
  (days) => days.map((it) => window.moment(it, defaultDayFormat)),
);
