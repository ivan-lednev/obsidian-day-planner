import type { App } from "obsidian";
import { getAPI } from "obsidian-dataview";

const fixtureVaultPath = "fixture-vault";
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

    const dump = {
      tasks: dataview?.pages(`"${fixtureVaultPath}"`).file.tasks.array(),
      headings: Object.fromEntries(
        app.vault
          .getMarkdownFiles()
          .map((tFile) => [
            tFile.path,
            app.metadataCache.getFileCache(tFile)?.headings,
          ]),
      ),
    };

    await app.vault.create(
      `${metadataDumpPath}/tasks.json`,
      JSON.stringify(dump, null, 2),
    );
  };
}
