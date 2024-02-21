import { Task } from "../types";

export function notifyAboutStartedTasks(tasks: Task[]) {
  if (tasks.length === 0) {
    return;
  }

  new Notification(`Task started: ${tasks[0].firstLineText}`);
}
