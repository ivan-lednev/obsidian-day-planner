import type { Moment } from "moment";
import { derived, readable } from "svelte/store";

export const currentTime = readable<Moment>(window.moment(), (set) => {
  const interval = setInterval(() => {
    set(window.moment());
  }, 1000);

  return () => {
    clearInterval(interval);
  };
});

export const isToday = derived(
  currentTime,
  ($currentTime) => (day: Moment) => $currentTime.isSame(day, "day"),
);
