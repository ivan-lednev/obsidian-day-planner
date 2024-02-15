import { App } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { writable } from "svelte/store";

import { DayPlannerSettings } from "../settings";
import { reportQueryPerformance, withPerformance } from "../util/performance";

export class DataviewFacade {
  readonly dataviewLoaded = writable(false);

  constructor(
    private readonly app: App,
    private readonly settings: () => DayPlannerSettings,
  ) {}

  getAllTasksFrom = (source: string) => {
    console.trace();
    const dataview = getAPI(this.app);

    if (!dataview) {
      return [];
    }

    this.dataviewLoaded.set(true);

    const { result, duration } = withPerformance(
      () => dataview.pages(source).file.tasks,
    );

    console.debug(reportQueryPerformance(source, duration));

    return result;
  };

  getAllListsFrom = (source: string) => {
    // todo: fix duplication
    const dataview = getAPI(this.app);

    if (!dataview) {
      return [];
    }

    this.dataviewLoaded.set(true);

    const { result, duration } = withPerformance(
      () => dataview.pages(source).file.lists,
    );

    console.debug(reportQueryPerformance(source, duration));

    return result;
  };

  getTasksFromPath = (path: string) => {
    return getAPI(this.app)?.page(path)?.file?.tasks;
  };
}
