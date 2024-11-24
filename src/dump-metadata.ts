import type { App } from "obsidian";
import { getAPI } from "obsidian-dataview";

const fixtureVaultPath = "fixture-vault";
const metadataDumpPath =
  ".obsidian/plugins/obsidian-day-planner/fixtures/metadata-dump";

export function createDumpMetadataCommand(app: App) {
  return async () => {
    const pathToHeadings = Object.fromEntries(
      app.vault
        .getMarkdownFiles()
        .map((tFile) => [
          tFile.path,
          app.metadataCache.getFileCache(tFile)?.headings,
        ]),
    );

    const exists = await app.vault.adapter.exists(metadataDumpPath);

    if (exists) {
      await app.vault.adapter.rmdir(metadataDumpPath, true);
    }

    await app.vault.adapter.mkdir(metadataDumpPath);

    await app.vault.create(
      `${metadataDumpPath}/headings-metadata.json`,
      JSON.stringify(pathToHeadings, null, 2),
    );

    const tasks = getAPI(app)
      ?.pages(`"${fixtureVaultPath}"`)
      .file.tasks.array();

    await app.vault.create(
      `${metadataDumpPath}/tasks.json`,
      JSON.stringify(tasks, null, 2),
    );
  };
}
