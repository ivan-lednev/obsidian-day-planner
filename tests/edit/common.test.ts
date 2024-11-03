import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { dayKey, nextDayKey } from "./util/fixtures";
import { setUp } from "./util/setup";
import { baseTask, threeTasks } from "./util/test-utils";

describe("drag one & common edit mechanics", () => {
  test("after edit confirmation, tasks freeze and stop reacting to cursor", async () => {
    const {
      todayControls,
      nextDayControls,
      moveCursorTo,
      dayToDisplayedTasks,
      confirmEdit,
    } = setUp({
      tasks: threeTasks,
    });

    todayControls.handleGripMouseDown(threeTasks[1], EditMode.DRAG);
    moveCursorTo("03:00", moment("2023-01-01"));

    await confirmEdit();

    nextDayControls.handleMouseEnter();
    moveCursorTo("05:00", moment("2023-01-02"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { id: "1" },
          { id: "2", startTime: moment("2023-01-01 03:00") },
          { id: "3" },
        ],
      },
    });
  });

  test.skip("when a task is set to its current time, nothing happens", async () => {
    const { todayControls, confirmEdit, props } = setUp();

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    await confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });

  describe("Tasks crossing midnight", () => {
    test("Splits multi-day tasks into single-day tasks", () => {
      const { dayToDisplayedTasks } = setUp({
        tasks: [
          {
            ...baseTask,
            startTime: moment("2023-01-01 23:00"),
            durationMinutes: 120,
            id: "1",
          },
        ],
      });

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-01 23:00"),
              durationMinutes: 59,
            },
          ],
        },
        [nextDayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-02 00:00"),
              durationMinutes: 60,
            },
          ],
        },
      });
    });

    test("Can turn a single day task into 2 tasks if it spans midnight", async () => {
      const task = {
        ...baseTask,
        startTime: moment("2023-01-01 22:00"),
        durationMinutes: 120,
        id: "1",
      };
      const {
        dayToDisplayedTasks,
        todayControls,
        moveCursorTo,
        confirmEdit,
        props,
      } = setUp({
        tasks: [task],
      });

      todayControls.handleGripMouseDown(task, EditMode.DRAG);
      moveCursorTo("23:00", moment("2023-01-01"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-01 23:00"),
              // todo: where is the extra minute?
              durationMinutes: 59,
            },
          ],
        },
        [nextDayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-02 00:00"),
              durationMinutes: 60,
            },
          ],
        },
      });

      await confirmEdit();

      expect(props.onUpdate).toHaveBeenCalledWith(expect.anything(), [
        expect.objectContaining({
          id: "1",
          startTime: moment("2023-01-01 23:00"),
          durationMinutes: 120,
        }),
      ]);
    });

    test("Editing the first task of a split works", async () => {
      const task = {
        ...baseTask,
        startTime: moment("2023-01-01 22:00"),
        durationMinutes: 180,
        id: "1",
      };

      const { todayControls, moveCursorTo, confirmEdit, props } = setUp({
        tasks: [task],
      });

      todayControls.handleGripMouseDown(task, EditMode.DRAG);
      moveCursorTo("23:30", moment("2023-01-01"));

      await confirmEdit();

      expect(props.onUpdate).toHaveBeenCalledWith(expect.anything(), [
        expect.objectContaining({
          id: "1",
          startTime: moment("2023-01-01 23:30"),
          durationMinutes: 180,
        }),
      ]);
    });

    test("Editing the second task of a split works", async () => {
      const task = {
        ...baseTask,
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 120,
        id: "1",
      };

      const { dayToDisplayedTasks, nextDayControls, moveCursorTo } = setUp({
        tasks: [task],
      });

      nextDayControls.handleGripMouseDown(task, EditMode.RESIZE);
      moveCursorTo("02:00", moment("2023-01-02"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-01 23:00"),
              durationMinutes: 59,
            },
          ],
        },
        [nextDayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-02 00:00"),
              durationMinutes: 120,
            },
          ],
        },
      });
    });
  });
});
