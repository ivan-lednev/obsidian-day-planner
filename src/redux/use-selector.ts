import type { Selector } from "@reduxjs/toolkit";
import { type Readable, type Subscriber } from "svelte/store";

import { getObsidianContext } from "../context/obsidian-context";

import { type RootState } from "./store";

const defaultEqualityFn = <T>(a: T, b: T) => a === b;

// Inspiration: https://gist.github.com/egargan/20267f9d481e9493a9627a8448034b09
export function useSelector<T>(
  selector: Selector<RootState, T>,
  equalityFn: (a: T, b: T) => boolean = defaultEqualityFn,
): Readable<T> {
  const { store } = getObsidianContext();

  return {
    subscribe: (fn: Subscriber<T>) => {
      let lastSelectorValue = selector(store.getState());
      fn(lastSelectorValue);

      return store.subscribe(() => {
        const selectorValue = selector(store.getState());

        if (!equalityFn(selectorValue, lastSelectorValue)) {
          lastSelectorValue = selectorValue;
          fn(lastSelectorValue);
        }
      });
    },
  };
}
