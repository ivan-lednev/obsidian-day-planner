import { omit } from "lodash/fp";
import type { Moment } from "moment";
import {
  type Subscriber,
  type Updater,
  type Writable,
  writable,
} from "svelte/store";

import { getId } from "../../util/id";

export function useDateRanges() {
  const ranges: Writable<Record<string, Moment[]>> = writable({});

  function trackRange(range: Moment[]) {
    const rangeKey = getId();

    ranges.update((previous) => ({ ...previous, [rangeKey]: range }));

    function untrack() {
      ranges.update(omit([rangeKey]));
    }

    function update(fn: Updater<Moment[]>) {
      ranges.update((previous) => ({
        ...previous,
        [rangeKey]: fn(previous[rangeKey]),
      }));
    }

    function set(value: Moment[]) {
      ranges.update((previous) => ({
        ...previous,
        [rangeKey]: value,
      }));
    }

    function subscribe(fn: Subscriber<Moment[]>) {
      return ranges.subscribe((next) => fn(next[rangeKey]));
    }

    return {
      subscribe,
      update,
      set,
      untrack,
    };
  }

  return {
    trackRange,
    ranges,
  };
}
