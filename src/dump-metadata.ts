import type { App } from "obsidian";
import { getAPI } from "obsidian-dataview";

const fixtureVaultPath = "fixtures/fixture-vault";
const metadataDumpPath =
  ".obsidian/plugins/obsidian-day-planner/fixtures/metadata-dump";

export function createDumpMetadataCommand(app: App) {
  return async () => {
    const dataview = getAPI(app);

    if (!dataview) {
      console.error("Dataview is not enabled");

      return;
    }

    const exists = await app.vault.adapter.exists(metadataDumpPath);

    if (exists) {
      await app.vault.adapter.rmdir(metadataDumpPath, true);
    }

    await app.vault.adapter.mkdir(metadataDumpPath);

    const markdownFiles = app.vault.getMarkdownFiles();

    const dump = {
      pathToMtime: Object.fromEntries(
        markdownFiles.map((it) => [it.path, it.stat.mtime]),
      ),
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
  };
}
