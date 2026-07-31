import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";
import * as t from "../../src/util/time-block-utils";

import {
  baseTimeBlocks,
  day,
  nextDay,
  timeBlocksWithUnscheduledTimeBlock,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("all-day tasks", () => {
  const range = {
    start: day,
    end: nextDay,
  };

  test("an unscheduled task gets moved to another day", () => {
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({
      timeBlocks: timeBlocksWithUnscheduledTimeBlock,
    });

    const timeBlock = timeBlocksWithUnscheduledTimeBlock[0];

    handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
    moveCursorTo(moment("2023-01-02 01:00"), "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...timeBlock,
        startTime: moment("2023-01-02 01:00"),
      },
    ]);
  });

  test("a scheduled task changes its type to all-day", () => {
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({ timeBlocks: baseTimeBlocks });

    const timeBlock = baseTimeBlocks[0];

    handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
    moveCursorTo(timeBlock.startTime, "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...timeBlock,
        isAllDayEvent: true,
      },
    ]);
  });

  test("can copy a scheduled task to all-day", () => {
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({ timeBlocks: baseTimeBlocks });

    const timeBlock = baseTimeBlocks[0];

    if (timeBlock.source === "unwritten") {
      throw new Error("The fixture task must be a written one");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, position, placing, ...taskWithoutFileLocation } = timeBlock;

    handlers.handleGripMouseDown(t.copy(timeBlock), EditMode.DRAG);
    moveCursorTo(timeBlock.startTime, "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...taskWithoutFileLocation,
        source: "unwritten",
        destination: { type: "plannerHeading" },
        id: expect.any(String),
        isAllDayEvent: true,
      },
    ]);
  });
});
