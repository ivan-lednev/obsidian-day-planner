import { MetadataCache } from "obsidian";
import { readable } from "svelte/store";

export function useDataviewChange(metadataCache: MetadataCache) {
  return readable<unknown[]>([], (set) => {
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
