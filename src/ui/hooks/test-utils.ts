import moment from "moment/moment";

import type { Task } from "../../types";

export const baseTask: Task = {
  symbol: "-",
  status: " ",
  startTime: moment("2023-01-01"),
  startMinutes: 0,
  durationMinutes: 60,
  text: "",
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
