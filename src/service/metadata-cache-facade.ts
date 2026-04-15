import { pipe } from "effect";
import { fromNullable, mapError } from "effect/Effect";
import type { MetadataCache } from "obsidian";

export class MetadataCacheFacade {
  constructor(private readonly metadataCache: MetadataCache) {}

  getListItem(path: string, line: number) {
    return (
      this.metadataCache
        .getCache(path)
        // todo: can it be a pure function?
        ?.listItems?.find((item) => item.position?.start?.line === line)
    );
  }

  getListItemEffect(path: string, line: number) {
    return pipe(
      fromNullable(
        this.metadataCache
          .getCache(path)
          ?.listItems?.find((item) => item.position?.start?.line === line),
      ),
      mapError(() => new Error(`No list item at ${path}:${line}`)),
    );
  }
}
