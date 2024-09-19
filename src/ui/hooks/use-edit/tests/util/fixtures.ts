import moment from "moment/moment";

import type { TasksForDay } from "../../../../../task-types";
import { baseTask } from "../../../test-utils";

export const dayKey = "2023-01-01";

export const day = moment(dayKey);

export const nextDayKey = "2023-01-02";

export const nextDay = moment(nextDayKey);

export const emptyTasks: Record<string, TasksForDay> = {
  [dayKey]: { withTime: [], noTime: [] },
  [nextDayKey]: { withTime: [], noTime: [] },
};

export const baseTasks: Record<string, TasksForDay> = {
  [dayKey]: { withTime: [baseTask], noTime: [] },
  [nextDayKey]: { withTime: [], noTime: [] },
};

export const unscheduledTask: Record<string, TasksForDay> = {
  [dayKey]: { withTime: [], noTime: [baseTask] },
  [nextDayKey]: { withTime: [], noTime: [] },
};
