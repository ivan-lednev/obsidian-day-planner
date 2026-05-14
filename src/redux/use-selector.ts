import { createSubscriber } from "svelte/reactivity";

import { type AppStore, type RootState } from "./store";

export function createUseSelector(reduxStore: AppStore) {
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

        // todo: might be a source of bugs
        const nextResult = selector(reduxStore.getState());
        previousResult = nextResult;

        return nextResult;
      },
    };
  };
}

export type useSelector = ReturnType<typeof createUseSelector>;
