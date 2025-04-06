import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";
import * as t from "../../src/util/task-utils";

import {
  baseTasks,
  day,
  nextDay,
  tasksWithUnscheduledTask,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("all-day tasks", () => {
  const range = {
    start: day,
    end: nextDay,
  };

  test("an unscheduled task gets moved to another day", () => {
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({
        tasks: tasksWithUnscheduledTask,
      });

    const task = tasksWithUnscheduledTask[0];

    handlers.handleGripMouseDown(task, EditMode.DRAG);
    moveCursorTo(moment("2023-01-02 01:00"), "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
      {
        ...task,
        startTime: moment("2023-01-02 01:00"),
      },
    ]);
  });

  test("a scheduled task changes its type to all-day", () => {
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({ tasks: baseTasks });

    const task = baseTasks[0];

    handlers.handleGripMouseDown(task, EditMode.DRAG);
    moveCursorTo(task.startTime, "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
      {
        ...task,
        isAllDayEvent: true,
      },
    ]);
  });

  test("can copy a scheduled task to all-day", () => {
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({ tasks: baseTasks });

    const task = baseTasks[0];

    handlers.handleGripMouseDown(t.copy(task), EditMode.DRAG);
    moveCursorTo(task.startTime, "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
      {
        ...task,
        location: undefined,
        id: expect.any(String),
        isAllDayEvent: true,
      },
    ]);
  });
});
