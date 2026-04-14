import { emDash } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { Task, WithTime } from "../task-types";

import { getMinutesSinceMidnight } from "./moment";
import { createTimestamp, getOneLineSummary } from "./task-utils";

export function notifyAboutStartedTasks(
  tasks: WithTime<Task>[],
  settings: DayPlannerSettings,
) {
  if (tasks.length === 0 && typeof Notification !== "undefined") {
    return;
  }

  const firstTask = tasks[0];
  const summary = getOneLineSummary(firstTask);
  const timestamp = createTimestamp(
    getMinutesSinceMidnight(firstTask.startTime),
    firstTask.durationMinutes,
    settings.timestampFormat,
    emDash,
  );

  new Notification(`Task started: ${summary}
${timestamp}`);
}
