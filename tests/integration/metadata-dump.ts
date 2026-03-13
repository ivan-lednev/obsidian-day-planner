import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { Moment } from "moment";
import type { CachedMetadata } from "obsidian";
import type { SListEntry, STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import { createInMemoryFile, type InMemoryFile } from "../test-utils";

const { join } = path.posix;

const dailyNoteFileNames = ["2025-07-19", "2025-07-20", "2025-07-28"];

const fixturesDirPath = "fixtures";
const dumpPath = join(fixturesDirPath, "metadata-dump", "tasks.json");
const fixtureVaultPath = join(fixturesDirPath, "fixture-vault");

export async function loadMetadataDump(): Promise<{
  inMemoryFiles: InMemoryFile[];
  inMemoryDailyNotes: { path: string; file: InMemoryFile; date: Moment }[];
  tasks: STask[];
  lists: SListEntry[];
  cachedMetadata: Record<string, CachedMetadata>;
}> {
  const files = await readdir(fixtureVaultPath);

  const inMemoryFiles = await Promise.all(
    files.map(async (file) => {
      const filePath = join(fixtureVaultPath, file);

      const stats = await stat(filePath);

      if (!stats.isFile()) {
        throw new TypeError(
          `Only files are supported in fixture vault, not this: ${filePath}`,
        );
      }

      const contents = await readFile(filePath, "utf8");

      return createInMemoryFile({ path: filePath, contents });
    }),
  );

  const rawMetadataDump = await readFile(dumpPath, "utf-8");

  const metadataDump = JSON.parse(rawMetadataDump);
  const { tasks, lists, cachedMetadata } = metadataDump;

  const pathToInMemoryFile = Object.fromEntries(
    inMemoryFiles.map((it) => [it.path, it]),
  );

  const inMemoryDailyNotes = dailyNoteFileNames.map((it) => {
    const path = join(fixtureVaultPath, `${it}.md`);
    const file = pathToInMemoryFile[path];

    isNotVoid(file, `There is no file for key: '${it}'`);

    return { path, file, date: window.moment(it) };
  });

  return {
    inMemoryFiles,
    inMemoryDailyNotes,
    tasks,
    lists,
    cachedMetadata,
  };
}
