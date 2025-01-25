import { debounce } from "obsidian";
import { onDestroy } from "svelte";
import { get, writable } from "svelte/store";

import { settings } from "../../global-store/settings";

interface UseDataviewSourceProps {
  refreshTasks: (dataviewSource: string) => void;
}

export function useDataviewSource({ refreshTasks }: UseDataviewSourceProps) {
  const dataviewSourceInput = writable(get(settings).dataviewSource);
  const errorMessage = writable("");

  function validate(source: string) {
    try {
      refreshTasks(source);
      return "";
    } catch (error) {
      return String(error);
    }
  }

  function tryUpdateSettings(source: string) {
    const validationError = validate(source);
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
