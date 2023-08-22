import { onDestroy } from "svelte";
import type { Writable } from "svelte/store";

export function watch(store: Writable<object>, fn: () => void) {
  const unsub = store.subscribe(() => fn());
  onDestroy(() => {
    unsub();
  });
}
