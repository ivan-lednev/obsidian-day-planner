import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { dayKey, nextDayKey } from "./util/fixtures";
import { setUp } from "./util/setup";
import { baseTask, threeTasks } from "./util/test-utils";

describe("drag one & common edit mechanics", () => {
  test("after edit confirmation, tasks freeze and stop reacting to cursor", async () => {
    const { handlers, moveCursorTo, dayToDisplayedTasks, confirmEdit } = setUp({
      tasks: threeTasks,
    });

    handlers.handleGripMouseDown(threeTasks[1], EditMode.DRAG);
    moveCursorTo(moment("2023-01-01 03:00"));

    await confirmEdit();

    moveCursorTo(moment("2023-01-02 05:00"));

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
    const { handlers, confirmEdit, props } = setUp();

    handlers.handleGripMouseDown(baseTask, EditMode.DRAG);
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
        handlers,
        moveCursorTo,
        confirmEdit,
        props,
      } = setUp({
        tasks: [task],
      });

      handlers.handleGripMouseDown(task, EditMode.DRAG);
      moveCursorTo(moment("2023-01-01 23:00"));

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

      expect(props.onUpdate).toHaveBeenCalledWith(
        expect.anything(),
        [
          expect.objectContaining({
            id: "1",
            startTime: moment("2023-01-01 23:00"),
            durationMinutes: 120,
          }),
        ],
        expect.anything(),
      );
    });

    test("Editing the first task of a split works", async () => {
      const task = {
        ...baseTask,
        startTime: moment("2023-01-01 22:00"),
        durationMinutes: 180,
        id: "1",
      };

      const { handlers, moveCursorTo, confirmEdit, props } = setUp({
        tasks: [task],
      });

      handlers.handleGripMouseDown(task, EditMode.DRAG);
      moveCursorTo(moment("2023-01-01 23:30"));

      await confirmEdit();

      expect(props.onUpdate).toHaveBeenCalledWith(
        expect.anything(),
        [
          expect.objectContaining({
            id: "1",
            startTime: moment("2023-01-01 23:30"),
            durationMinutes: 180,
          }),
        ],
        expect.anything(),
      );
    });

    test("Editing the second task of a split works", async () => {
      const task = {
        ...baseTask,
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 120,
        id: "1",
      };

      const { dayToDisplayedTasks, moveCursorTo, handlers } = setUp({
        tasks: [task],
      });

      handlers.handleGripMouseDown(task, EditMode.RESIZE);
      moveCursorTo(moment("2023-01-02 02:00"));

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
