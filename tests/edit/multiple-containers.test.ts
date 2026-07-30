import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";

import {
  baseTimeBlock,
  baseTimeBlocks,
  dayKey,
  emptyTimeBlocks,
  nextDayKey,
  timeBlocksWithUnscheduledTimeBlock,
  threeTimeBlocksOverTwoDays,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("moving tasks between containers", () => {
  test("with no edit operation in progress, nothing happens on mouse move", () => {
    const { moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: baseTimeBlocks,
    });

    const initial = get(dayToDisplayedTimeBlocks);

    moveCursorTo(moment("2023-01-01 01:00"));

    expect(get(dayToDisplayedTimeBlocks)).toEqual(initial);
  });

  test("scheduling works between days", () => {
    const { handlers, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: timeBlocksWithUnscheduledTimeBlock,
    });

    handlers.handleGripMouseDown(baseTimeBlock, EditMode.DRAG);
    moveCursorTo(moment("2023-01-02 01:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [nextDayKey]: {
        withTime: [{ startTime: moment("2023-01-02 01:00") }],
      },
    });
  });

  test("drag works between days", () => {
    const { handlers, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: [
        baseTimeBlock,
        { ...baseTimeBlock, id: "2", startTime: moment("2023-01-01 01:00") },
        { ...baseTimeBlock, id: "3", startTime: moment("2023-01-02 01:00") },
      ],
    });

    handlers.handleGripMouseDown(baseTimeBlock, EditMode.DRAG);
    moveCursorTo(moment("2023-01-02 01:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [dayKey]: {
        withTime: [{ id: "2", startTime: moment("2023-01-01 01:00") }],
      },
      [nextDayKey]: {
        withTime: [
          { startTime: moment("2023-01-02 01:00") },
          { id: "3", startTime: moment("2023-01-02 01:00") },
        ],
      },
    });
  });

  test("drag many works between days", () => {
    const { handlers, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: threeTimeBlocksOverTwoDays,
    });

    handlers.handleGripMouseDown(baseTimeBlock, EditMode.DRAG_AND_SHIFT_OTHERS);
    moveCursorTo(moment("2023-01-02 02:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [nextDayKey]: {
        withTime: [
          { startTime: moment("2023-01-02 02:00") },
          { id: "2", startTime: moment("2023-01-02 03:00") },
          { id: "3", startTime: moment("2023-01-02 04:00") },
        ],
      },
    });
  });

  test("drag many does not mess with other days", () => {
    const { handlers, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: threeTimeBlocksOverTwoDays,
    });

    handlers.handleGripMouseDown(baseTimeBlock, EditMode.DRAG_AND_SHIFT_OTHERS);
    moveCursorTo(moment("2023-01-01 05:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { startTime: moment("2023-01-01 05:00") },
          { startTime: moment("2023-01-01 06:00") },
        ],
      },
      [nextDayKey]: {
        withTime: [{ id: "3", startTime: moment("2023-01-02 02:00") }],
      },
    });
  });

  test.skip("create works between days", () => {
    const { handlers, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
      timeBlocks: emptyTimeBlocks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    handlers.handleContainerMouseDown();
    moveCursorTo(moment("2023-01-02 02:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [nextDayKey]: {
        withTime: [
          { startTime: moment("2023-01-02 01:00"), durationMinutes: 60 },
        ],
      },
    });
  });

  // todo: fix
  test("resize doesn't works between days", () => {
    const { handlers, dayToDisplayedTimeBlocks } = setUp();

    handlers.handleResizerMouseDown(baseTimeBlock, EditMode.RESIZE);

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [dayKey]: {
        withTime: [{ id: "id", startTime: moment("2023-01-01 00:00") }],
      },
    });
  });
});
