import { Readable, writable } from "svelte/store";

export type Watchable = Pick<Readable<unknown>, "subscribe"> & {
  trigger: () => void;
};

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
