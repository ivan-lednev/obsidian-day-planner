import { get } from "svelte/store";

import { Tasks } from "../../../../types";
import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
import { useEditContext } from "../use-edit-context";

import { baseTasks, day, dayKey, nextDay, nextDayKey } from "./util/fixtures";
import { createProps, setUp_MULTIDAY } from "./util/setup";

describe("moving tasks between containers", () => {
  test("with no edit operation in progress, nothing happens on mouse move", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp_MULTIDAY({
      tasks: baseTasks,
    });

    const initial = get(displayedTasks);

    todayControls.handleMouseEnter();
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toEqual(initial);
  });

  test.skip.each([
    ["handleResizeStart", false],
    ["handleGripMouseDown", true],
    ["startScheduling", true],
  ])(
    "the task moves to another container only for certain operations",
    (
      editMode: keyof ReturnType<
        ReturnType<typeof useEditContext>["getEditHandlers"]
      >,
      shouldMove: boolean,
    ) => {
      const props = createProps();

      const { getEditHandlers } = useEditContext(props);

      const { displayedTasks: tasksForDay, ...handlers } = getEditHandlers(day);
      const {
        displayedTasks: tasksForNextDay,
        handleMouseEnter: moveMouseToNextDay,
      } = getEditHandlers(nextDay);

      handlers[editMode]({} as MouseEvent, baseTask);
      moveMouseToNextDay();

      const [lengthOfTasksForDay, lengthOfTasksForNextDay] = shouldMove
        ? [0, 1]
        : [1, 0];

      expect(get(tasksForDay).withTime).toHaveLength(lengthOfTasksForDay);
      expect(get(tasksForNextDay).withTime).toHaveLength(
        lengthOfTasksForNextDay,
      );
    },
  );

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
      setUp_MULTIDAY({
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
      setUp_MULTIDAY({
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
      setUp_MULTIDAY({
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
});
