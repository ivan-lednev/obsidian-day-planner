/**
 * Svelte compares store values by identity, so to trigger an update, just return a new object.
 */
export function getUpdateTrigger() {
  return {};
}
