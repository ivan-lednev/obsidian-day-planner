import { Task } from "../types";

import { getFirstLine } from "./task-utils";

export function notifyAboutStartedTasks(tasks: Task[]) {
  if (tasks.length === 0) {
    return;
  }

  const firstTask = tasks[0];

  new Notification(`Task started: ${getFirstLine(firstTask.text)}`);
}
