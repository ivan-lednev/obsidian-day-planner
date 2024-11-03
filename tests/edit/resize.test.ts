import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { toMinutes } from "../../src/util/moment";

import { dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";
import { baseTask, threeTasks } from "./util/test-utils";

describe("resize", () => {
  test("resizing changes duration", () => {
    const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp();

    todayControls.handleResizerMouseDown(baseTask, EditMode.RESIZE);
    moveCursorTo("03:00", moment("2023-01-01"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ durationMinutes: 180 }],
      },
    });
  });

  test("Resize from top works the same way", () => {
    const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp();

    todayControls.handleResizerMouseDown(baseTask, EditMode.RESIZE_FROM_TOP);
    moveCursorTo("00:30", moment("2023-01-01"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { durationMinutes: 30, startTime: moment("2023-01-01 00:30") },
        ],
      },
    });
  });

  test("Once the minimal duration is reached, the task starts shifting down", () => {
    const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp();

    todayControls.handleResizerMouseDown(baseTask, EditMode.RESIZE_FROM_TOP);
    moveCursorTo("01:30", moment("2023-01-01"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          {
            durationMinutes: defaultSettingsForTests.minimalDurationMinutes,
            startTime: moment("2023-01-01 01:30"),
          },
        ],
      },
    });
  });

  describe("resize many", () => {
    test("resizing with neighbors shifts neighbors as well", () => {
      const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
      });

      todayControls.handleResizerMouseDown(
        threeTasks[1],
        EditMode.RESIZE_AND_SHIFT_OTHERS,
      );
      moveCursorTo("04:00", moment("2023-01-01"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { id: "1" },
            { id: "2" },
            {
              id: "3",
              startTime: moment("2023-01-01 04:00"),
            },
          ],
        },
      });
    });

    test("Resizing from top works the same way", () => {
      const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
      });

      todayControls.handleResizerMouseDown(
        threeTasks[1],
        EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS,
      );
      moveCursorTo("01:30", moment("2023-01-01"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            {
              id: "1",
              startTime: moment("2023-01-01 00:30"),
              durationMinutes: toMinutes("01:00"),
            },
            {
              id: "2",
              startTime: moment("2023-01-01 01:30"),
              durationMinutes: toMinutes("01:30"),
            },
            {
              id: "3",
              startTime: moment("2023-01-01 03:00"),
            },
          ],
        },
      });
    });
  });

  describe("Resize and shrink others", () => {
    test("Resizing shrinks neighbors & when they reach minimal duration, they start shifting", () => {
      const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
      });

      todayControls.handleResizerMouseDown(
        threeTasks[1],
        EditMode.RESIZE_AND_SHRINK_OTHERS,
      );
      moveCursorTo("04:00", moment("2023-01-01"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { id: "1" },
            {
              id: "2",
              durationMinutes: toMinutes("02:00"),
            },
            {
              id: "3",
              startTime: moment("2023-01-01 04:00"),
              durationMinutes: defaultSettingsForTests.minimalDurationMinutes,
            },
          ],
        },
      });
    });

    test("Resizing from top works the same way", () => {
      const { todayControls, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
      });

      todayControls.handleResizerMouseDown(
        threeTasks[1],
        EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS,
      );
      moveCursorTo("00:30", moment("2023-01-01"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            {
              id: "1",
              durationMinutes: defaultSettingsForTests.minimalDurationMinutes,
            },
            {
              id: "2",
              startTime: moment("2023-01-01 00:30"),
              durationMinutes: toMinutes("02:30"),
            },
            {
              id: "3",
              startTime: moment("2023-01-01 03:00"),
            },
          ],
        },
      });
    });
  });
});
