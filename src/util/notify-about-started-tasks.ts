import type { TaskWithTime } from "../types";

import { getOneLineSummary } from "./task-utils";

export function notifyAboutStartedTasks(tasks: TaskWithTime[]) {
  if (tasks.length === 0) {
    return;
  }

  const firstTask = tasks[0];

  new Notification(`Task started: ${getOneLineSummary(firstTask)}`);
}
