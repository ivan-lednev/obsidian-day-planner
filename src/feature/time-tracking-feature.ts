import {
  type MetadataCache,
  Notice,
  TFile,
  type Vault,
  type Workspace,
} from "obsidian";
import { isNotVoid } from "typed-assert";

import type DayPlanner from "../main";
import type { AppDispatch } from "../redux/store";
import { fileDeleted, metadataChanged } from "../redux/tracker/tracker-slice";

export class TimeTrackingFeature {
  constructor(
    private readonly plugin: DayPlanner,
    private readonly workspace: Workspace,
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache,
    private readonly dispatch: AppDispatch,
  ) {}

  load() {
    this.workspace.onLayoutReady(async () => {
      await this.initialLoad();

      this.registerEvents();
    });
  }

  private async initialLoad() {
    const start = performance.now();

    const initialCachingPromises = this.vault
      .getMarkdownFiles()
      .map(async (file) => {
        const cache = this.metadataCache.getFileCache(file);

        if (!cache) {
          return;
        }

        const contents = await this.vault.cachedRead(file);

        this.dispatch(metadataChanged({ path: file.path, contents, cache }));
      });

    // todo: will cause stale state if we change a file during this
    await Promise.all(initialCachingPromises);

    const end = performance.now();

    new Notice(`Planner index initialized in ${(end - start).toFixed(2)}ms`);
  }

  private registerEvents() {
    const { plugin, metadataCache, dispatch, vault } = this;

    plugin.registerEvent(
      metadataCache.on("changed", (file, contents, cache) => {
        dispatch(metadataChanged({ path: file.path, contents, cache }));
      }),
    );

    plugin.registerEvent(
      vault.on("delete", (file) => {
        dispatch(fileDeleted({ path: file.path }));
      }),
    );

    plugin.registerEvent(
      vault.on("rename", async (file, oldPath) => {
        if (!(file instanceof TFile)) {
          return;
        }

        dispatch(fileDeleted({ path: oldPath }));

        const cache = metadataCache.getFileCache(file);

        isNotVoid(
          cache,
          `Invalid state: could not find cache for a renamed file: ${oldPath} -> ${file.path}`,
        );

        const contents = await vault.cachedRead(file);

        dispatch(metadataChanged({ path: file.path, contents, cache }));
      }),
    );
  }
}
