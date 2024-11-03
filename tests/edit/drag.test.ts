import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";
import { baseTask, threeTasks } from "./util/test-utils";

describe("drag", () => {
  test("when drag starts, target task reacts to cursor", () => {
    const { handlers, moveCursorTo, dayToDisplayedTasks } = setUp();

    handlers.handleGripMouseDown(baseTask, EditMode.DRAG);
    moveCursorTo(moment("2023-01-01 01:00"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          {
            startTime: moment("2023-01-01 01:00"),
          },
        ],
      },
    });
  });

  describe("drag many", () => {
    test("tasks below react to shifting selected task once there is overlap", () => {
      const { handlers, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
      });

      handlers.handleGripMouseDown(
        threeTasks[1],
        EditMode.DRAG_AND_SHIFT_OTHERS,
      );
      moveCursorTo(moment("2023-01-01 03:00"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
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
        },
      });
    });

    test("tasks below stay in initial position once the overlap is reversed, tasks above shift as well", () => {
      const { handlers, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
        settings: { ...defaultSettingsForTests },
      });

      handlers.handleGripMouseDown(
        threeTasks[1],
        EditMode.DRAG_AND_SHIFT_OTHERS,
      );
      moveCursorTo(moment("2023-01-01 03:00"));
      moveCursorTo(moment("2023-01-01 01:00"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
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
        },
      });
    });

    test.todo("tasks stop moving once there is not enough time");
  });

  describe("drag and shrink others", () => {
    test("Next task shrinks up to minimal duration and starts moving down", () => {
      const { handlers, moveCursorTo, dayToDisplayedTasks } = setUp({
        tasks: threeTasks,
      });

      handlers.handleGripMouseDown(
        threeTasks[1],
        EditMode.DRAG_AND_SHRINK_OTHERS,
      );
      moveCursorTo(moment("2023-01-01 03:00"));

      expect(get(dayToDisplayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
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
        },
      });
    });
  });
});
