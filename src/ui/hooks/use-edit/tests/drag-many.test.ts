import { get } from "svelte/store";

import { Tasks } from "../../../../types";
import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";

import {
  dayKey,
} from "./util/fixtures";
import { setUp_MULTIDAY } from "./util/setup";

describe("drag many", () => {
  test("tasks below react to shifting selected task once they start overlap", () => {
    const middleTask = {
      ...baseTask,
      id: "2",
      startMinutes: toMinutes("02:00"),
    };

    const tasks: Tasks = {
      [dayKey]: {
        withTime: [
          { ...baseTask, id: "1", startMinutes: toMinutes("01:00") },
          middleTask,
          { ...baseTask, id: "3", startMinutes: toMinutes("03:00") },
        ],
        noTime: [],
      },
    };

    const { todayControls, moveCursorTo, displayedTasks } = setUp_MULTIDAY({
      tasks,
    });

    todayControls.handleMouseEnter();
    todayControls.handleGripMouseDown(
      { ctrlKey: true } as MouseEvent,
      middleTask,
    );
    moveCursorTo("03:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { id: "1", startMinutes: toMinutes("01:00") },
          { id: "2", startMinutes: toMinutes("03:00") },
          { id: "3", startMinutes: toMinutes("04:00") },
        ],
      },
    });
  });

  test("tasks below stay in initial position once the overlap is reversed, tasks above shift as well", () => {
    const middleTask = {
      ...baseTask,
      id: "2",
      startMinutes: toMinutes("02:00"),
    };

    const tasks: Tasks = {
      [dayKey]: {
        withTime: [
          { ...baseTask, id: "1", startMinutes: toMinutes("01:00") },
          middleTask,
          { ...baseTask, id: "3", startMinutes: toMinutes("03:00") },
        ],
        noTime: [],
      },
    };

    const { todayControls, moveCursorTo, displayedTasks } = setUp_MULTIDAY({
      tasks,
    });

    todayControls.handleMouseEnter();
    todayControls.handleGripMouseDown(
      { ctrlKey: true } as MouseEvent,
      middleTask,
    );
    moveCursorTo("03:00");
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { id: "1", startMinutes: toMinutes("00:00") },
          { id: "2", startMinutes: toMinutes("01:00") },
          { id: "3", startMinutes: toMinutes("03:00") },
        ],
      },
    });
  });

  test.todo("tasks stop moving once there is not enough time");
});
