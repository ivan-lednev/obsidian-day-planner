import moment from "moment";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";

import {
  baseTimeBlock,
  baseTimeBlocks,
  createTimeBlock,
  dayKey,
  emptyTimeBlocks,
  nextDayKey,
  timeBlocksWithUnscheduledTimeBlock,
  threeTimeBlocksOverTwoDays,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("moving tasks between containers", () => {
  test("with no edit operation in progress, nothing happens on mouse move", () => {
    const { moveCursorTo, getBlocksForDay } = setUp({
      timeBlocks: baseTimeBlocks,
    });

    const initial = getBlocksForDay(dayKey);

    moveCursorTo(moment("2023-01-01 01:00"));

    expect(getBlocksForDay(dayKey)).toEqual(initial);
  });

  test("scheduling works between days", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
      timeBlocks: timeBlocksWithUnscheduledTimeBlock,
    });

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.DRAG });
    moveCursorTo(moment("2023-01-02 01:00"));

    expect(getBlocksForDay(nextDayKey)).toMatchObject([
      { startTime: moment("2023-01-02 01:00") },
    ]);
  });

  test("drag works between days", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
      timeBlocks: [
        baseTimeBlock,
        createTimeBlock("2", { startTime: moment("2023-01-01 01:00") }),
        createTimeBlock("3", { startTime: moment("2023-01-02 01:00") }),
      ],
    });

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.DRAG });
    moveCursorTo(moment("2023-01-02 01:00"));

    expect(getBlocksForDay(dayKey)).toMatchObject([
      { id: "2", startTime: moment("2023-01-01 01:00") },
    ]);
    expect(getBlocksForDay(nextDayKey)).toMatchObject([
      { startTime: moment("2023-01-02 01:00") },
      { id: "3", startTime: moment("2023-01-02 01:00") },
    ]);
  });

  test("drag many works between days", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
      timeBlocks: threeTimeBlocksOverTwoDays,
    });

    startEdit({
      timeBlock: baseTimeBlock,
      mode: EditMode.DRAG_AND_SHIFT_OTHERS,
    });
    moveCursorTo(moment("2023-01-02 02:00"));

    expect(getBlocksForDay(nextDayKey)).toMatchObject([
      { startTime: moment("2023-01-02 02:00") },
      { id: "2", startTime: moment("2023-01-02 03:00") },
      { id: "3", startTime: moment("2023-01-02 04:00") },
    ]);
  });

  test("drag many does not mess with other days", () => {
    const { startEdit, moveCursorTo, getBlocksForDay } = setUp({
      timeBlocks: threeTimeBlocksOverTwoDays,
    });

    startEdit({
      timeBlock: baseTimeBlock,
      mode: EditMode.DRAG_AND_SHIFT_OTHERS,
    });
    moveCursorTo(moment("2023-01-01 05:00"));

    expect(getBlocksForDay(dayKey)).toMatchObject([
      { startTime: moment("2023-01-01 05:00") },
      { startTime: moment("2023-01-01 06:00") },
    ]);
    expect(getBlocksForDay(nextDayKey)).toMatchObject([
      { id: "3", startTime: moment("2023-01-02 02:00") },
    ]);
  });

  test.skip("create works between days", () => {
    const { startCreate, moveCursorTo, getBlocksForDay } = setUp({
      timeBlocks: emptyTimeBlocks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    startCreate();
    moveCursorTo(moment("2023-01-02 02:00"));

    expect(getBlocksForDay(nextDayKey)).toMatchObject([
      { startTime: moment("2023-01-02 01:00"), durationMinutes: 60 },
    ]);
  });

  // todo: fix: resizing to the block's own start pushes it into the previous
  //  day instead of stopping at the day boundary
  test("resize doesn't works between days", () => {
    const { startEdit, getBlocksForDay } = setUp();

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.RESIZE });

    expect(getBlocksForDay(dayKey)).toEqual([]);
    expect(getBlocksForDay("2022-12-31")).toMatchObject([
      { id: "id", startTime: moment("2022-12-31 23:50") },
    ]);
  });
});
