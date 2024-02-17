import { App } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { writable } from "svelte/store";

import { withPerformanceReport } from "../util/performance";

export class DataviewFacade {
  // todo: there is a separate store for that, remove this
  readonly dataviewLoaded = writable(false);

  constructor(private readonly app: App) {}

  getAllTasksFrom = (source: string) => {
    // todo: move this guard up the signal chain
    // We can say: 'If Dv is not loaded, don't update this branch of signals'
    if (!this.getDataview()) {
      return [];
    }

    return withPerformanceReport(
      () => this.getDataview().pages(source).file.tasks,
      {
        source,
      },
    );
  };

  getAllListsFrom = (source: string) => {
    // todo: move this guard up the signal chain
    if (!this.getDataview()) {
      return [];
    }

    return withPerformanceReport(
      () => this.getDataview().pages(source).file.lists,
      {
        source,
      },
    );
  };

  getTasksFromPath = (path: string) => {
    return getAPI(this.app)?.page(path)?.file?.tasks;
  };

  private getDataview() {
    const dataview = getAPI(this.app);

    if (dataview) {
      this.dataviewLoaded.set(true);
      return dataview;
    }

    return undefined;
  }
}
