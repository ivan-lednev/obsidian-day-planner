import type { App } from "obsidian";

const metadataDumpPath =
  ".obsidian/plugins/obsidian-day-planner/fixtures/metadata-dump";

export function createDumpMetadataCommand(app: App) {
  return async () => {
    const exists = await app.vault.adapter.exists(metadataDumpPath);

    if (exists) {
      await app.vault.adapter.rmdir(metadataDumpPath, true);
    }

    await app.vault.adapter.mkdir(metadataDumpPath);

    const dump = {
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
