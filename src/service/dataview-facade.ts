import { STask, type DataviewApi } from "obsidian-dataview";

import {
  type Scheduler,
  createBackgroundBatchScheduler,
} from "../util/scheduler";

export class DataviewFacade {
  private readonly scheduler: Scheduler<STask[]> =
    createBackgroundBatchScheduler({
      timeRemainingLowerLimit: 5,
    });

  constructor(private readonly getDataview: () => DataviewApi | undefined) {}

  getAllTasksFrom = async (source: string) => {
    return new Promise<STask[]>((resolve) => {
      const paths: string[] = this.getDataview()?.pagePaths(source).array();

      const pageQueries: Array<() => STask[]> = paths.map(
        (path) => () =>
          this.getDataview()?.page(path)?.file.tasks.array() || [],
      );

      this.scheduler.enqueueTasks(pageQueries, (results) => {
        resolve(results.flat());
      });
    });
  };

  getPathsFrom = (source: string) => {
    return this.getDataview()?.pages(source).file.path.array() || [];
  };

  getAllListsFrom = (source: string) => {
    return this.getDataview()?.pages(source).file.lists.array() || [];
  };

  getTaskAtLine({ path, line }: { path: string; line: number }) {
    return this.getTasksFromPath(path).find(
      (sTask: STask) => sTask.line === line,
    );
  }

  getTasksFromPath = (path: string): STask[] =>
    this.getDataview()?.page(path)?.file.tasks.array() || [];
}
