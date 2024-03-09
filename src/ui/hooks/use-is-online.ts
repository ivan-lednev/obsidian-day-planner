import { readable } from "svelte/store";

export function useIsOnline() {
  return readable(window.navigator.onLine, (set) => {
    function handleOnline() {
      set(true);
    }

    function handleOffline() {
      set(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    function cleanUp() {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }

    return cleanUp;
  });
}
