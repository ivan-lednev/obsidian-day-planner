import { debounce } from "obsidian";
import { onDestroy } from "svelte";
import { get, writable } from "svelte/store";

import { settings } from "../../global-store/settings";
import type { RefreshDataviewFn } from "../../types";

export function useDataviewSource(props: {
  refreshDataviewFn: RefreshDataviewFn;
}) {
  const { refreshDataviewFn } = props;
  const dataviewSourceInput = writable(get(settings).dataviewSource);
  const errorMessage = writable("");

  async function validate(source: string) {
    try {
      await refreshDataviewFn(source);

      return "";
    } catch (error) {
      return String(error);
    }
  }

  async function tryUpdateSettings(source: string) {
    const validationError = await validate(source);

    errorMessage.set(validationError);

    if (validationError.length === 0) {
      settings.update((previous) => ({ ...previous, dataviewSource: source }));
    }
  }

  const debouncedUpdate = debounce(tryUpdateSettings, 1000, true);

  const unsubscribe = dataviewSourceInput.subscribe((value) => {
    debouncedUpdate(value);
  });

  onDestroy(() => {
    unsubscribe();
  });

  return {
    errorMessage,
    dataviewSourceInput,
  };
}
