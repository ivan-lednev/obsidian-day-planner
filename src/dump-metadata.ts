import type { App } from "obsidian";
import { getAPI } from "obsidian-dataview";

const fixtureVaultPath = "fixtures/fixture-vault";
const metadataDumpPath =
  ".obsidian/plugins/obsidian-day-planner/fixtures/metadata-dump";
const metadataCacheDumpPath =
  ".obsidian/plugins/obsidian-day-planner/fixtures/metadata-cache-dump";

export function createDumpMetadataCommand(app: App) {
  return async () => {
    const dataview = getAPI(app);

    if (!dataview) {
      console.error("Dataview is not enabled");

      return;
    }
    const markdownFiles = app.vault.getMarkdownFiles();

    const exists = await app.vault.adapter.exists(metadataDumpPath);

    if (exists) {
      await app.vault.adapter.rmdir(metadataDumpPath, true);
    }

    await app.vault.adapter.mkdir(metadataDumpPath);

    const dump = {
      lists: dataview.pages(`"${fixtureVaultPath}"`).file.lists.array(),
      tasks: dataview.pages(`"${fixtureVaultPath}"`).file.tasks.array(),
      cachedMetadata: Object.fromEntries(
        app.vault
          .getMarkdownFiles()
          .map((it) => [it.path, app.metadataCache.getFileCache(it)]),
      ),
    };

    await app.vault.create(
      `${metadataDumpPath}/tasks.json`,
      JSON.stringify(dump, null, 2),
    );

    const metadataCacheDumpExists = await app.vault.adapter.exists(
      metadataCacheDumpPath,
    );

    if (metadataCacheDumpExists) {
      await app.vault.adapter.rmdir(metadataCacheDumpPath, true);
    }

    await app.vault.adapter.mkdir(metadataCacheDumpPath);

    const pathToCache = Object.fromEntries(
      markdownFiles.map((it) => [it.path, app.metadataCache.getFileCache(it)]),
    );

    await app.vault.create(
      `${metadataCacheDumpPath}/metadataCache.json`,
      JSON.stringify(pathToCache, null, 2),
    );
  };
}
