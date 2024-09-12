import type { Task, WithTime } from "../task-types";

import { getOneLineSummary } from "./task-utils";

export function notifyAboutStartedTasks(tasks: WithTime<Task>[]) {
  if (tasks.length === 0) {
    return;
  }

  const firstTask = tasks[0];

  new Notification(`Task started: ${getOneLineSummary(firstTask)}`);
}
