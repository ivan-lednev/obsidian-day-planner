import { writable } from "svelte/store";

export function createWatchable() {
  const { subscribe, set } = writable<object>();

  function trigger() {
    set({});
  }

  return {
    subscribe,
    trigger,
  };
}
