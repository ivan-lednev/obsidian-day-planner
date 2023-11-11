import { produce } from "immer";
import moment from "moment/moment";

import { TasksForDay } from "../../../../../types";
import { toMinutes } from "../../../../../util/moment";
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

const secondTask = {
  ...baseTask,
  startMinutes: toMinutes("01:10"),
  durationMinutes: 60,
  id: "2",
};

export const twoTasksInColumn = produce(baseTasks, (draft) => {
  draft[dayKey].withTime.push(secondTask);
});
