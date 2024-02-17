import { App } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { readable } from "svelte/store";

export function useDataviewLoaded(app: App) {
  return readable(Boolean(getAPI(app)), (set) => {
    // @ts-expect-error
    const eventRef = app.metadataCache.on("dataview:metadata-change", () => {
      app.metadataCache.offref(eventRef);
      set(true);
    });
  });
}
