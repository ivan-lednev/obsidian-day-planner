import type { Selector } from "@reduxjs/toolkit";
import { createSubscriber } from "svelte/reactivity";
import { type Subscriber } from "svelte/store";

import { type AppStore, type RootState } from "./store";

const defaultEqualityFn = <T>(a: T, b: T) => a === b;

// todo: remove
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

export function createuseSelectorV2(reduxStore: AppStore) {
  return <T>(selector: (state: RootState) => T) => {
    let previousResult = selector(reduxStore.getState());

    const subscribe = createSubscriber((update) => {
      const unsubscribeFromReduxStore = reduxStore.subscribe(() => {
        const nextResult = selector(reduxStore.getState());

        if (previousResult !== nextResult) {
          previousResult = nextResult;

          update();
        }
      });

      return () => {
        unsubscribeFromReduxStore();
      };
    });

    return {
      get current() {
        subscribe();

        const nextResult = selector(reduxStore.getState());
        previousResult = nextResult;

        return nextResult;
      },
    };
  };
}

export function createSvelteSignalFromReduxStore(reduxStore: AppStore) {
  const subscribe = createSubscriber((update) => {
    const unsubscribeFromReduxStore = reduxStore.subscribe(update);

    return () => {
      unsubscribeFromReduxStore();
    };
  });

  return {
    get current() {
      subscribe();

      return reduxStore.getState();
    },
  };
}

export type UseSelector = ReturnType<typeof createUseSelector>;
export type useSelectorV2 = ReturnType<typeof createuseSelectorV2>;
