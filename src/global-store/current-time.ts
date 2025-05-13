import type { Moment } from "moment";
import { derived, fromStore, readable } from "svelte/store";

const currentTimeRefreshIntervalMillis = 5 * 1000;

export const currentTime = readable<Moment>(window.moment(), (set) => {
  const interval = setInterval(() => {
    set(window.moment());
  }, currentTimeRefreshIntervalMillis);

  return () => {
    clearInterval(interval);
  };
});

export const currentTimeSignal = fromStore(currentTime);

export const isToday = derived(
  currentTime,
  ($currentTime) => (day: Moment) => $currentTime.isSame(day, "day"),
);
