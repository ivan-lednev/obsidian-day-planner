import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
import { useEditContext } from "../use-edit-context";

import { day, dayKey, nextDay, nextDayKey } from "./util/fixtures";
import {
  createProps,
  setPointerTime,
  setUp,
  setUp_MULTIDAY,
} from "./util/setup";
import { TasksForDay } from "../../../../types";

describe("moving tasks between containers", () => {
  test.todo(
    "with no edit operation in progress, nothing happens on mouse move",
  );

  test("the task gets moved to another container", () => {
    const props = createProps();

    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks: tasksForDay, handleGripMouseDown } =
      getEditHandlers(day);
    const {
      displayedTasks: tasksForNextDay,
      handleMouseEnter: moveMouseToNextDay,
    } = getEditHandlers(nextDay);

    handleGripMouseDown({} as MouseEvent, baseTask);
    moveMouseToNextDay();

    expect(get(tasksForDay).withTime).toHaveLength(0);
    expect(get(tasksForNextDay).withTime).toHaveLength(1);
  });

  test("the task reacts to mouse movement in another container", () => {
    const props = createProps();

    const { getEditHandlers } = useEditContext(props);

    const { pointerOffsetY, ...dayControls } = getEditHandlers(day);
    const nextDayControls = getEditHandlers(nextDay);

    dayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();
    setPointerTime(pointerOffsetY, "9:00");

    const {
      withTime: [task],
    } = get(nextDayControls.displayedTasks);

    expect(task).toMatchObject({
      startMinutes: toMinutes("09:00"),
    });
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

  test("drag many works between days", () => {
    const tasks: Record<string, TasksForDay> = {
      [dayKey]: {
        withTime: [
          { ...baseTask, id: "1", startMinutes: toMinutes("01:00") },

          { ...baseTask, id: "2", startMinutes: toMinutes("01:00") },
        ],
        noTime: [],
      },
      [nextDayKey]: {
        withTime: [{ ...baseTask, id: "3", startMinutes: toMinutes("01:00") }],
        noTime: [],
      },
    };

    const { todayControls, nextDayControls, moveCursorTo } = setUp_MULTIDAY({
      tasks,
    });

    todayControls.handleGripMouseDown(
      { ctrlKey: true } as MouseEvent,
      baseTask,
    );
    nextDayControls.handleMouseEnter();
    moveCursorTo("01:00");

    const {
      withTime: [task2],
    } = get(todayControls.displayedTasks);

    const {
      withTime: [task1, task3],
    } = get(nextDayControls.displayedTasks);

    expect(task1).toMatchObject({
      startMinutes: toMinutes("01:00"),
    });
    expect(task2).toMatchObject({
      startMinutes: toMinutes("01:00"),
    });
    expect(task3).toMatchObject({
      startMinutes: toMinutes("02:00"),
    });
  });
});
