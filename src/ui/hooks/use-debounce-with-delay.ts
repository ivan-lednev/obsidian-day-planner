import { type Readable, readable } from "svelte/store";

import { debounceWithDelay } from "../../util/debounce-with-delay";
import { getUpdateTrigger } from "../../util/store";

export function useDebounceWithDelay(
  updater: Readable<unknown>,
  delayer: Readable<unknown>,
  timeout: number,
) {
  // We use readable instead of derived, because its callback function runs only once,
  //  and not per every dependency update.
  return readable({}, (set) => {
    const [update, delayUpdate] = debounceWithDelay(
      () => set(getUpdateTrigger()),
      timeout,
    );

    const unsubscribeFromUpdater = updater.subscribe(update);
    const unsubscribeFromDelayer = delayer.subscribe(delayUpdate);

    return () => {
      unsubscribeFromUpdater();
      unsubscribeFromDelayer();
    };
  });
}
