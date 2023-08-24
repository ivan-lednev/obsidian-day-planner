import { readable } from "svelte/store";

export const currentTime = readable(window.moment(), (set) => {
  const interval = setInterval(() => {
    set(window.moment());
  }, 1000);

  return () => {
    clearInterval(interval);
  };
});
