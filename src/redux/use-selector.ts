import type { Selector } from "@reduxjs/toolkit";
import { type Subscriber } from "svelte/store";

import { type AppStore, type RootState } from "./store";

const defaultEqualityFn = <T>(a: T, b: T) => a === b;

// Inspiration: https://gist.github.com/egargan/20267f9d481e9493a9627a8448034b09
export function createUseSelector(store: AppStore) {
  return <T>(
    selector: Selector<RootState, T>,
    props?: {
      equalityFn?: (a: T, b: T) => boolean;
    },
  ) => {
    const { equalityFn = defaultEqualityFn } = props || {};

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
  };
}

export type UseSelector = ReturnType<typeof createUseSelector>;
