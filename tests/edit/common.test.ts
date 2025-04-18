import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { getUpdateTrigger } from "../../src/util/store";

import { baseTask, dayKey, nextDayKey, threeTasks } from "./util/fixtures";
import { setUp } from "./util/setup";

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

  test("Edits are interruptible", async () => {
    const { handlers, props, confirmEdit } = setUp({
      tasks: threeTasks,
    });

    handlers.handleGripMouseDown(threeTasks[1], EditMode.DRAG);
    props.abortEditTrigger.set(getUpdateTrigger());

    await confirmEdit();

    expect(props.onEditAborted).toHaveBeenCalledTimes(1);
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

  describe("Multi-day rows", () => {
    function daysToMinutes(days: number) {
      return days * 60 * 24;
    }

    const multiDayTask = {
      ...baseTask,
      isAllDayEvent: true,
      startTime: moment("2023-01-05 00:00"),
      durationMinutes: daysToMinutes(4),
      id: "1",
    };

    test.each([
      {
        description:
          "Tasks that start before the range don't show their full length",
        tasks: [multiDayTask],
        range: {
          start: moment("2023-01-06 00:00"),
          end: moment("2023-01-10 00:00"),
        },
        result: [
          {
            startTime: moment("2023-01-06 00:00"),
            durationMinutes: daysToMinutes(3),
            truncated: ["left"],
          },
        ],
      },
      {
        description:
          "Tasks that go over the range get truncated at the end of the range (and not on the day before)",
        tasks: [multiDayTask],
        range: {
          start: moment("2023-01-03 00:00"),
          end: moment("2023-01-07 00:00"),
        },
        result: [
          {
            startTime: moment("2023-01-05 00:00"),
            // Note: ranges are end-inclusive
            durationMinutes: daysToMinutes(3),
            truncated: ["right"],
          },
        ],
      },
    ])("$description", async ({ tasks, range, result }) => {
      const { getDisplayedAllDayTasksForMultiDayRow } = setUp({
        tasks,
      });

      expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject(
        result,
      );
    });
  });
});
