/**
 * Prevent a function from running until there is a pause in typing
 */
export function debounceWhileTyping(
  cb: (...args: unknown[]) => void,
  timeout: number,
) {
  let registeredTimeout: number | null;
  let lastArgs: unknown[];

  function debounced(...args: unknown[]) {
    lastArgs = args;

    if (registeredTimeout) {
      return;
    }

    registeredTimeout = window.setTimeout(() => {
      cb(...args);
      registeredTimeout = null;
    }, timeout);
  }

  function handleKeyDown() {
    if (registeredTimeout) {
      clearTimeout(registeredTimeout);
      registeredTimeout = null;
      debounced(...lastArgs);
    }
  }

  document.addEventListener("keydown", handleKeyDown);

  function cleanUp() {
    document.removeEventListener("keydown", handleKeyDown);
  }

  return [debounced, cleanUp];
}
