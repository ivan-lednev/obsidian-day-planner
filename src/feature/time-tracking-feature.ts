import { chunk } from "lodash/fp";
import {
  type MetadataCache,
  TFile,
  type Vault,
  type Workspace,
} from "obsidian";

import type DayPlanner from "../main";
import type { AppDispatch } from "../redux/store";
import { fileDeleted, indexRequested } from "../redux/tracker/tracker-slice";

export class TimeTrackingFeature {
  private static readonly INITIAL_LOAD_CHUNK_SIZE = 100;

  constructor(
    private readonly plugin: DayPlanner,
    private readonly workspace: Workspace,
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache,
    private readonly dispatch: AppDispatch,
  ) {}

  load() {
    this.workspace.onLayoutReady(async () => {
      this.registerEvents();

      await this.initialLoad();
    });
  }

  private async initialLoad() {
    const paths = this.vault.getMarkdownFiles().map((file) => file.path);

    chunk(TimeTrackingFeature.INITIAL_LOAD_CHUNK_SIZE, paths).forEach((batch) =>
      this.dispatch(indexRequested(batch)),
    );
  }

  private registerEvents() {
    const { plugin, metadataCache, dispatch, vault } = this;

    plugin.registerEvent(
      metadataCache.on("changed", (file) => {
        dispatch(indexRequested([file.path]));
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
        dispatch(indexRequested([file.path]));
      }),
    );
  }
}
