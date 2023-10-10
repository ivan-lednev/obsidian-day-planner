export function debounceWithDelay(
  cb: (...args: unknown[]) => void,
  timeout: number,
) {
  let lastTimeout: number | null;
  let lastArgs: unknown[];

  function set() {
    lastTimeout = window.setTimeout(() => {
      cb(...lastArgs);
      lastTimeout = null;
    }, timeout);
  }

  function debouncedFn(...args: unknown[]) {
    lastArgs = args;

    if (!lastTimeout) {
      set();
    }
  }

  function delay() {
    if (lastTimeout) {
      clearTimeout(lastTimeout);
      set();
    }
  }

  return [debouncedFn, delay];
}
