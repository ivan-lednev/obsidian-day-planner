import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { baseTimeBlock, dayKey, threeTimeBlocks } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("drag", () => {
  test("when drag starts, target task reacts to cursor", () => {
    const { startEdit, moveCursorTo, dayToDisplayedTimeBlocks } = setUp();

    startEdit({ timeBlock: baseTimeBlock, mode: EditMode.DRAG });
    moveCursorTo(moment("2023-01-01 01:00"));

    expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
      [dayKey]: [
        {
          startTime: moment("2023-01-01 01:00"),
        },
      ],
    });
  });

  describe("drag many", () => {
    test("tasks below react to shifting selected task once there is overlap", () => {
      const { startEdit, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
        timeBlocks: threeTimeBlocks,
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.DRAG_AND_SHIFT_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 03:00"));

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
        [dayKey]: [
          {
            id: "1",
            startTime: moment("2023-01-01 01:00"),
          },
          {
            id: "2",
            startTime: moment("2023-01-01 03:00"),
          },
          {
            id: "3",
            startTime: moment("2023-01-01 04:00"),
          },
        ],
      });
    });

    test("tasks below stay in initial position once the overlap is reversed, tasks above shift as well", () => {
      const { startEdit, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
        timeBlocks: threeTimeBlocks,
        settings: { ...defaultSettingsForTests },
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.DRAG_AND_SHIFT_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 03:00"));
      moveCursorTo(moment("2023-01-01 01:00"));

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
        [dayKey]: [
          {
            id: "1",
            startTime: moment("2023-01-01 00:00"),
          },
          {
            id: "2",
            startTime: moment("2023-01-01 01:00"),
          },
          {
            id: "3",
            startTime: moment("2023-01-01 03:00"),
          },
        ],
      });
    });

    test.todo("tasks stop moving once there is not enough time");
  });

  describe("drag and shrink others", () => {
    test("Next task shrinks up to minimal duration and starts moving down", () => {
      const { startEdit, moveCursorTo, dayToDisplayedTimeBlocks } = setUp({
        timeBlocks: threeTimeBlocks,
      });

      startEdit({
        timeBlock: threeTimeBlocks[1],
        mode: EditMode.DRAG_AND_SHRINK_OTHERS,
      });
      moveCursorTo(moment("2023-01-01 03:00"));

      expect(get(dayToDisplayedTimeBlocks)).toMatchObject({
        [dayKey]: [
          {
            id: "1",
            startTime: moment("2023-01-01 01:00"),
          },
          {
            id: "2",
            startTime: moment("2023-01-01 03:00"),
          },
          {
            id: "3",
            durationMinutes: defaultSettingsForTests.minimalDurationMinutes,
            startTime: moment("2023-01-01 04:00"),
          },
        ],
      });
    });
  });
});
