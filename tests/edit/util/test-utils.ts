import moment from "moment/moment";

import type { LocalTask, WithPlacing, WithTime } from "../../../src/task-types";

export const baseTaskStartTime = moment("2023-01-01 00:00");

export const baseTask: WithPlacing<WithTime<LocalTask>> = {
  symbol: "-",
  status: " ",
  startTime: baseTaskStartTime,
  durationMinutes: 60,
  text: "text",
  placing: {
    xOffsetPercent: 0,
    widthPercent: 100,
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
