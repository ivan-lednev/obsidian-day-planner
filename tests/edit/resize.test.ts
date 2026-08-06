import moment from "moment";
import { test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { toMinutes } from "../../src/util/moment";

import { baseTimeBlock, dayKey, threeTimeBlocks } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("resize", () => {
  test("resizing changes duration", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp();

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.RESIZE });
    moveCursorTo(moment("2023-01-01 03:00"));

    expect(getBlocksForDay(dayKey)).toMatchObject([{ durationMinutes: 180 }]);
  });

  test("Resize from top works the same way", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp();

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.RESIZE_FROM_TOP });
    moveCursorTo(moment("2023-01-01 00:30"));

    expect(getBlocksForDay(dayKey)).toMatchObject([
      { durationMinutes: 30, startTime: moment("2023-01-01 00:30") },
    ]);
  });

  test("Once the minimal duration is reached, the task starts shifting down", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp();

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.RESIZE_FROM_TOP });
    moveCursorTo(moment("2023-01-01 01:30"));

    expect(getBlocksForDay(dayKey)).toMatchObject([
      {
        durationMinutes: defaultSettingsForTests.minimalDurationMinutes,
        startTime: moment("2023-01-01 01:30"),
      },
    ]);
  });

  describe("resize many", () => {
    test("resizing with neighbors shifts neighbors as well", () => {
      const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
        timeBlocks: threeTimeBlocks,
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.RESIZE_AND_SHIFT_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 04:00"));

      expect(getBlocksForDay(dayKey)).toMatchObject([
        { id: "1" },
        { id: "2" },
        {
          id: "3",
          startTime: moment("2023-01-01 04:00"),
        },
      ]);
    });

    test("Resizing from top works the same way", () => {
      const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
        timeBlocks: threeTimeBlocks,
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 01:30"));

      expect(getBlocksForDay(dayKey)).toMatchObject([
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
      ]);
    });
  });

  describe("Resize and shrink others", () => {
    test("Resizing shrinks neighbors & when they reach minimal duration, they start shifting", () => {
      const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
        timeBlocks: threeTimeBlocks,
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.RESIZE_AND_SHRINK_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 04:00"));

      expect(getBlocksForDay(dayKey)).toMatchObject([
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
      ]);
    });

    test("Resizing from top works the same way", () => {
      const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
        timeBlocks: threeTimeBlocks,
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 00:30"));

      expect(getBlocksForDay(dayKey)).toMatchObject([
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
      ]);
    });
  });
});
