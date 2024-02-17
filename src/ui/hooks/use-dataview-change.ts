import { MetadataCache } from "obsidian";
import { readable } from "svelte/store";

export function useDataviewChange(metadataCache: MetadataCache) {
  return readable([], (set) => {
    const eventRef = metadataCache.on(
      // @ts-expect-error
      "dataview:metadata-change",
      (...args: unknown[]) => set(args),
    );

    return () => {
      metadataCache.offref(eventRef);
    };
  });
}
