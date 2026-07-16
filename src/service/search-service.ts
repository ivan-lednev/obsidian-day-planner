import type { MetadataCache, Pos, Vault } from "obsidian";

import { filterByKeywords } from "../util/keyword-filter";
import { isTaskCache } from "../util/metadata";

import { createListItemEntry } from "./index/list-item-utils";

export interface TaskMatch {
  type: "task";
  path: string;
  position: Pos;
  text: string;
}

export interface FileMatch {
  type: "file";
  path: string;
}

export type Match = TaskMatch | FileMatch;

export interface SearchService {
  search(query: string): Promise<Match[]>;
}

export class VaultSearchService implements SearchService {
  constructor(
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache,
  ) {}

  async search(query: string): Promise<Match[]> {
    const files = this.vault.getMarkdownFiles();

    const taskMatchLists = await Promise.all(
      files.map(async (file): Promise<TaskMatch[]> => {
        const listItems = this.metadataCache
          .getCache(file.path)
          ?.listItems?.filter(isTaskCache);

        if (!listItems || listItems.length === 0) {
          return [];
        }

        const contents = await this.vault.cachedRead(file);

        const entries = listItems.map((listItemCache) => {
          const entry = createListItemEntry({
            path: file.path,
            contents,
            listItemCache,
          });

          return { ...entry, text: entry.text.split("\n")[0] };
        });

        return filterByKeywords(entries, query, (entry) => [
          entry.text,
          entry.path,
        ]).map((entry) => ({
          type: "task" as const,
          path: file.path,
          position: entry.position,
          text: entry.text,
        }));
      }),
    );

    const fileMatches: FileMatch[] = filterByKeywords(files, query, (file) => [
      file.path,
    ]).map((file) => ({ type: "file" as const, path: file.path }));

    return [...taskMatchLists.flat(), ...fileMatches];
  }
}
