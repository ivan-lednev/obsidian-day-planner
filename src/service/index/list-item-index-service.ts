import { Array } from "effect";
import type { Pos } from "obsidian";

import {
  createTaskEntryId,
  type DenormalizedListItemEntry,
  type ListItemEntryWithChildren,
} from "../../redux/index/index-slice";
import {
  createLineToChildrenLookup,
  getTextAtPosition,
} from "../../util/metadata";

import type { FileWithMetadata, IndexService } from "./index-service";
import type { ListItemIndexExtensionService } from "./list-item-index-extension-service";
import { createListItemEntry, flatten } from "./list-item-utils";

export class ListItemIndexService implements IndexService {
  constructor(private readonly extensions: ListItemIndexExtensionService[]) {}

  index(props: FileWithMetadata) {
    const denormalizedListItemEntries =
      this.createDenormalizedListItemEntries(props);

    const flatListItemEntries = Array.dedupeWith(
      denormalizedListItemEntries.flatMap(flatten),
      (a, b) => a.id === b.id,
    );

    return {
      taskEntries: flatListItemEntries.map(
        ({ logEntries, planEntries, ...rest }) => ({
          logEntryIds: logEntries?.map((it) => it.id),
          planEntryIds: planEntries?.map((it) => it.id),
          ...rest,
        }),
      ),
      logEntries: denormalizedListItemEntries.flatMap(
        (it) => it.logEntries || [],
      ),
      planEntries: denormalizedListItemEntries.flatMap(
        (it) => it.planEntries || [],
      ),
    };
  }

  private createDenormalizedListItemEntries(
    props: FileWithMetadata,
  ): ListItemEntryWithChildren[] {
    const { metadata, text, path } = props;

    if (!metadata.listItems) {
      return [];
    }

    const indexers = this.extensions.map((extension) =>
      extension.forFile(props),
    );

    const denormalizedListItemEntries = metadata.listItems
      .map((listItemCache) => {
        const rawListItemEntryWithContext = {
          listItemCache,
          rawListItemEntry: createListItemEntry({
            path,
            contents: text,
            listItemCache,
          }),
          listItemText: getTextAtPosition(text, listItemCache.position),
        };

        const extensionResults = indexers.map((indexer) =>
          indexer(rawListItemEntryWithContext),
        );

        return {
          ...rawListItemEntryWithContext.rawListItemEntry,
          planEntries: extensionResults.flatMap(
            (result) => result.planEntries ?? [],
          ),
          logEntries: extensionResults.flatMap(
            (result) => result.logEntries ?? [],
          ),
          propsPosition: extensionResults.reduce<Pos | undefined>(
            (propsPosition, result) => result.propsPosition ?? propsPosition,
            undefined,
          ),
        };
      })
      .filter(
        (entry) => entry.planEntries.length > 0 || entry.logEntries.length > 0,
      );

    if (denormalizedListItemEntries.length === 0) {
      return [];
    }

    // tree-building for nested list item operations

    const lineToChildrenLookup = createLineToChildrenLookup(metadata.listItems);
    const idToListItemEntry = denormalizedListItemEntries.reduce<
      Record<string, DenormalizedListItemEntry>
    >((result, current) => {
      result[current.id] = current;

      return result;
    }, {});

    const createTree = (
      listItemEntry: DenormalizedListItemEntry,
    ): ListItemEntryWithChildren => {
      return {
        ...listItemEntry,
        children:
          lineToChildrenLookup[listItemEntry.position.start.line]?.map(
            (listItemCache) => {
              const id = createTaskEntryId(
                path,
                listItemCache.position.start.line,
              );
              const previouslyIndexed = idToListItemEntry[id];
              const childEntry =
                previouslyIndexed ||
                createListItemEntry({ path, listItemCache, contents: text });

              return createTree(childEntry);
            },
          ) || [],
      };
    };

    // add children recursively
    return denormalizedListItemEntries.map((listItemEntry) =>
      createTree(listItemEntry),
    );
  }
}
