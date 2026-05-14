import type { CachedMetadata, ListItemCache, Loc, Pos } from "obsidian";
import { isNotVoid } from "typed-assert";

export type TaskCache = ListItemCache & { task: string };

export type PartialPos = Omit<Pos, "end"> & { end?: Loc };

export function isTaskCache(
  listItemCache: ListItemCache,
): listItemCache is TaskCache {
  return listItemCache.task !== undefined;
}

export function getTextAtPosition(inputText: string, position: Pos) {
  return inputText.slice(position.start.offset, position.end.offset);
}

export function isInside(inner: Pos, outer: PartialPos) {
  const innerStartIsInside = inner.start.offset >= outer.start.offset;

  if (!outer.end) {
    return innerStartIsInside;
  }

  return innerStartIsInside && inner.end.offset <= outer.end.offset;
}

export function createLineToChildrenLookup(listItems: ListItemCache[]) {
  return listItems.reduce<Record<number, ListItemCache[]>>((result, item) => {
    if (item.parent < 0) {
      return result;
    }

    (result[item.parent] ??= []).push(item);

    return result;
  }, {});
}

export function getHeadingSectionPosition(
  cache: CachedMetadata,
  headingText: string,
) {
  const { headings } = cache;

  if (!headings) {
    return undefined;
  }

  const targetIndex = headings.findIndex((h) => h.heading === headingText);

  if (targetIndex === -1) {
    return undefined;
  }

  const target = headings[targetIndex];

  isNotVoid(target);

  const nextBoundary = headings
    .slice(targetIndex + 1)
    .find((heading) => heading.level <= target.level);

  return {
    start: target.position.start,
    end: nextBoundary?.position.start,
  };
}
