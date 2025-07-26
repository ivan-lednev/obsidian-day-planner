import { partition } from "lodash/fp";
import type { Vault } from "obsidian";
import { STask, type DataviewApi } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import {
  type Scheduler,
  createBackgroundBatchScheduler,
} from "../util/scheduler";

interface STaskCacheEntry {
  mtime: number;
  tasks: STask[];
}

export class DataviewFacade {
  private readonly scheduler: Scheduler<STask[]> =
    createBackgroundBatchScheduler({
      timeRemainingLowerLimit: 5,
    });
  private readonly taskCache = new Map<string, STaskCacheEntry>();

  constructor(
    private readonly getDataview: () => DataviewApi | undefined,
    private readonly vault: Vault,
  ) {}

  private isCached = (path: string) => {
    const cacheForPath = this.taskCache.get(path);

    if (!cacheForPath) {
      return false;
    }

    const fileInVault = this.vault.getFileByPath(path);

    isNotVoid(fileInVault);

    return cacheForPath.mtime === fileInVault.stat.mtime;
  };

  getAllTasksFrom = async (source: string) => {
    const pathsForSource: string[] = this.getDataview()
      ?.pagePaths(source)
      .array();

    const [pathsWithValidCache, pathsToBeQueried] = partition(
      this.isCached,
      pathsForSource,
    );

    const cachedTasks = pathsWithValidCache.map(
      (it) => this.taskCache.get(it)?.tasks || [],
    );

    const pageQueries: Array<() => STask[]> = pathsToBeQueried.map(
      (path) => () => {
        const tasks = this.getDataview()?.page(path)?.file.tasks.array() || [];
        const mtime = this.vault.getFileByPath(path)?.stat.mtime;

        if (mtime && tasks.length > 0) {
          this.taskCache.set(path, { mtime, tasks });
        }

        return tasks;
      },
    );

    return new Promise<STask[]>((resolve) => {
      this.scheduler.enqueueTasks(pageQueries, (results) => {
        resolve(results.concat(cachedTasks).flat());
      });
    });
  };

  getAllListsFrom = (paths: string[]) => {
    return (
      this.getDataview()
        ?.pages(paths.map((it) => `"${it}"`).join(" OR "))
        .file.lists.array() || []
    );
  };

  getTaskAtLine({ path, line }: { path: string; line: number }) {
    return this.getTasksFromPath(path).find(
      (sTask: STask) => sTask.line === line,
    );
  }

  private getTasksFromPath = (path: string): STask[] =>
    this.getDataview()?.page(path)?.file.tasks.array() || [];
}
