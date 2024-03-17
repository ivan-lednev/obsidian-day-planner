import { App } from "obsidian";
import { getAPI, STask } from "obsidian-dataview";
import { writable } from "svelte/store";

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

    return this.getDataview().pages(source).file.tasks;
  };

  getAllListsFrom = (source: string) => {
    // todo: move this guard up the signal chain
    if (!this.getDataview()) {
      return [];
    }

    return this.getDataview().pages(source).file.lists;
  };

  getTaskFromCaretLocation({ path, line }: { path: string; line: number }) {
    return this.getTasksFromPath(path).find(
      (sTask: STask) => sTask.line === line,
    );
  }

  private getTasksFromPath = (path: string): STask[] => {
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
