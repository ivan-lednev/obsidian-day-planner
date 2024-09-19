import { App } from "obsidian";
import { getAPI, STask } from "obsidian-dataview";

export class DataviewFacade {
  constructor(private readonly app: App) {}

  getAllTasksFrom = (source: string) => {
    return getAPI(this.app)?.pages(source).file.tasks.array() || [];
  };

  getAllListsFrom = (source: string) => {
    return getAPI(this.app)?.pages(source).file.lists.array() || [];
  };

  getTaskFromCaretLocation({ path, line }: { path: string; line: number }) {
    return this.getTasksFromPath(path).find(
      (sTask: STask) => sTask.line === line,
    );
  }

  private getTasksFromPath = (path: string): STask[] => {
    return getAPI(this.app)?.page(path)?.file.tasks || [];
  };
}
