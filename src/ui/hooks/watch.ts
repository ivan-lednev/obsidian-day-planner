import { onDestroy } from "svelte";

import type { Watchable } from "../../store/create-watchable";

export function watch(store: Watchable, fn: () => void) {
  const unsub = store.subscribe(() => fn());
  onDestroy(() => {
    unsub();
  });
}
