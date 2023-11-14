import { get } from "svelte/store";

import { Tasks } from "../../../../types";
import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";

import { baseTasks, dayKey, emptyTasks, nextDayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("moving tasks between containers", () => {
  test("with no edit operation in progress, nothing happens on mouse move", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp({
      tasks: baseTasks,
    });

    const initial = get(displayedTasks);

    todayControls.handleMouseEnter();
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toEqual(initial);
  });

  test.todo("moving a task to day without a note");

  test("scheduling works between days", () => {
    const tasks: Tasks = {
      [dayKey]: {
        withTime: [],
        noTime: [baseTask],
      },
      [nextDayKey]: {
        withTime: [],
        noTime: [],
      },
    };

    const { todayControls, nextDayControls, moveCursorTo, displayedTasks } =
      setUp({
        tasks,
      });

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        noTime: [],
        withTime: [],
      },
      [nextDayKey]: {
        withTime: [{ startMinutes: toMinutes("01:00") }],
      },
    });
  });

  test("drag works between days", () => {
    const tasks: Tasks = {
      [dayKey]: {
        withTime: [
          baseTask,
          { ...baseTask, id: "2", startMinutes: toMinutes("01:00") },
        ],
        noTime: [],
      },
      [nextDayKey]: {
        withTime: [{ ...baseTask, id: "3", startMinutes: toMinutes("01:00") }],
        noTime: [],
      },
    };

    const { todayControls, nextDayControls, moveCursorTo, displayedTasks } =
      setUp({
        tasks,
      });

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ id: "2", startMinutes: toMinutes("01:00") }],
      },
      [nextDayKey]: {
        withTime: [
          { startMinutes: toMinutes("01:00") },
          { id: "3", startMinutes: toMinutes("01:00") },
        ],
      },
    });
  });

  test("drag many works between days", () => {
    const tasks: Tasks = {
      [dayKey]: {
        withTime: [
          baseTask,
          { ...baseTask, id: "2", startMinutes: toMinutes("01:00") },
        ],
        noTime: [],
      },
      [nextDayKey]: {
        withTime: [{ ...baseTask, id: "3", startMinutes: toMinutes("01:00") }],
        noTime: [],
      },
    };

    const { todayControls, nextDayControls, moveCursorTo, displayedTasks } =
      setUp({
        tasks,
      });

    todayControls.handleGripMouseDown(
      { ctrlKey: true } as MouseEvent,
      baseTask,
    );
    nextDayControls.handleMouseEnter();
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ id: "2", startMinutes: toMinutes("01:00") }],
      },
      [nextDayKey]: {
        withTime: [
          { startMinutes: toMinutes("01:00") },
          { id: "3", startMinutes: toMinutes("02:00") },
        ],
      },
    });
  });

  test("create works between days", () => {
    const { todayControls, moveCursorTo, nextDayControls, displayedTasks } =
      setUp({
        tasks: emptyTasks,
      });

    moveCursorTo("01:00");
    todayControls.handleMouseDown();
    nextDayControls.handleMouseEnter();
    moveCursorTo("02:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [],
      },
      [nextDayKey]: {
        withTime: [{ startMinutes: toMinutes("01:00"), durationMinutes: 60 }],
      },
    });
  });

  test.todo("resize doesn't work between days");
});
