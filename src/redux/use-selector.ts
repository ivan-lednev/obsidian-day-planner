import type { Store } from "@reduxjs/toolkit";
import { createSubscriber } from "svelte/reactivity";

export function createUseSelector<StateType>(reduxStore: Store) {
  return <SelectorReturnType>(
    selector: (state: StateType) => SelectorReturnType,
  ) => {
    let previousResult: SelectorReturnType;

    const subscribe = createSubscriber((update) => {
      const unsubscribeFromReduxStore = reduxStore.subscribe(() => {
        const nextResult = selector(reduxStore.getState());

        if (previousResult !== nextResult) {
          previousResult = nextResult;

          update();
        }
      });

      return unsubscribeFromReduxStore;
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

export type UseSelector<StateType> = ReturnType<
  typeof createUseSelector<StateType>
>;
