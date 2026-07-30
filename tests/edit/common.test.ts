import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { getUpdateTrigger } from "../../src/util/store";

import {
  baseTimeBlock,
  dayKey,
  nextDayKey,
  threeTimeBlocks,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("drag one & common edit mechanics", () => {
  test("after edit confirmation, tasks freeze and stop reacting to cursor", async () => {
    const { handlers, moveCursorTo, dayToDisplayedTimeBlocks, confirmEdit } =
      setUp({
        timeBlocks: threeTimeBlocks,
      });

    handlers.handleGripMouseDown(threeTimeBlocks[1], EditMode.DRAG);
    moveCursorTo(moment("2023-01-01 03:00"));

    await confirmEdit();

    moveCursorTo(moment("2023-01-02 05:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
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
      timeBlocks: threeTimeBlocks,
    });

    handlers.handleGripMouseDown(threeTimeBlocks[1], EditMode.DRAG);
    props.abortEditTrigger.set(getUpdateTrigger());

    await confirmEdit();

    expect(props.onEditAborted).toHaveBeenCalledTimes(1);
  });

  test.skip("when a task is set to its current time, nothing happens", async () => {
    const { handlers, confirmEdit, props } = setUp();

    handlers.handleGripMouseDown(baseTimeBlock, EditMode.DRAG);
    await confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });

  describe("Tasks crossing midnight", () => {
    test("Splits multi-day tasks into single-day tasks", () => {
      const { dayToDisplayedTimeBlocks } = setUp({
        timeBlocks: [
          {
            ...baseTimeBlock,
            startTime: moment("2023-01-01 23:00"),
            durationMinutes: 120,
            id: "1",
          },
        ],
      });

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
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
      const timeBlock = {
        ...baseTimeBlock,
        startTime: moment("2023-01-01 22:00"),
        durationMinutes: 120,
        id: "1",
      };
      const {
        dayToDisplayedTimeBlocks,
        handlers,
        moveCursorTo,
        confirmEdit,
        props,
      } = setUp({
        timeBlocks: [timeBlock],
      });

      handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
      moveCursorTo(moment("2023-01-01 23:00"));

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
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
      const timeBlock = {
        ...baseTimeBlock,
        startTime: moment("2023-01-01 22:00"),
        durationMinutes: 180,
        id: "1",
      };

      const { handlers, moveCursorTo, confirmEdit, props } = setUp({
        timeBlocks: [timeBlock],
      });

      handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
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
      const timeBlock = {
        ...baseTimeBlock,
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 120,
        id: "1",
      };

      const { dayToDisplayedTimeBlocks, moveCursorTo, handlers } = setUp({
        timeBlocks: [timeBlock],
      });

      handlers.handleGripMouseDown(timeBlock, EditMode.RESIZE);
      moveCursorTo(moment("2023-01-02 02:00"));

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
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

    const multiDayTimeBlock = {
      ...baseTimeBlock,
      isAllDayEvent: true,
      startTime: moment("2023-01-05 00:00"),
      durationMinutes: daysToMinutes(4),
      id: "1",
    };

    test.each([
      {
        description:
          "Tasks that start before the range don't show their full length",
        timeBlocks: [multiDayTimeBlock],
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
        timeBlocks: [multiDayTimeBlock],
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
    ])("$description", async ({ timeBlocks, range, result }) => {
      const { getDisplayedAllDayTimeBlocksForMultiDayRow } = setUp({
        timeBlocks,
      });

      expect(
        get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
      ).toMatchObject(result);
    });
  });
});
