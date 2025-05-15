import moment from "moment";

import type { LocalTask, WithPlacing, WithTime } from "../../../src/task-types";

export const dayKey = "2023-01-01";
export const day = moment(dayKey);
export const nextDayKey = "2023-01-02";
export const nextDay = moment(nextDayKey);

export const emptyTasks = [];
export const baseTaskStartTime = moment("2023-01-01 00:00");
export const baseTask: WithPlacing<WithTime<LocalTask>> = {
  symbol: "-",
  status: " ",
  startTime: baseTaskStartTime,
  durationMinutes: 60,
  text: "text",
  placing: {
    offsetPercent: 0,
    spanPercent: 100,
  },
  location: {
    path: "path",
    position: {
      start: {
        line: 0,
        col: 0,
        offset: 0,
      },
      end: {
        line: 0,
        col: 0,
        offset: 0,
      },
    },
  },
  id: "id",
};
export const unscheduledTask: LocalTask = {
  ...baseTask,
  isAllDayEvent: true,
};
export const threeTasks: WithPlacing<WithTime<LocalTask>>[] = [
  {
    ...baseTask,
    id: "1",
    startTime: moment("2023-01-01 01:00"),
  },
  {
    ...baseTask,
    id: "2",
    startTime: moment("2023-01-01 02:00"),
  },
  {
    ...baseTask,
    id: "3",
    startTime: moment("2023-01-01 03:00"),
  },
];
export const threeTasksOverTwoDays: WithTime<LocalTask>[] = [
  baseTask,
  { ...baseTask, id: "2", startTime: moment("2023-01-01 01:00") },
  { ...baseTask, id: "3", startTime: moment("2023-01-02 02:00") },
];
export const baseTasks: Array<WithTime<LocalTask>> = [baseTask];
export const tasksWithUnscheduledTask: Array<LocalTask> = [unscheduledTask];
