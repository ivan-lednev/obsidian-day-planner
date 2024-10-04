import moment from "moment";
import { get } from "svelte/store";

import { defaultSettingsForTests } from "../../../../settings";
import type { DayToTasks } from "../../../../task-types";
import { baseTask, threeTasks } from "../../test-utils";
import { EditMode } from "../types";

import { dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("drag", () => {
  test("when drag starts, target task reacts to cursor", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp();

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toMatchObject({
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
      const tasks: DayToTasks = {
        [dayKey]: {
          withTime: threeTasks,
          noTime: [],
        },
      };

      const { todayControls, moveCursorTo, displayedTasks } = setUp({
        tasks,
      });

      todayControls.handleGripMouseDown(
        threeTasks[1],
        EditMode.DRAG_AND_SHIFT_OTHERS,
      );
      moveCursorTo("03:00");

      expect(get(displayedTasks)).toMatchObject({
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
      const tasks: DayToTasks = {
        [dayKey]: {
          withTime: threeTasks,
          noTime: [],
        },
      };

      const { todayControls, moveCursorTo, displayedTasks } = setUp({
        tasks,
        settings: { ...defaultSettingsForTests },
      });

      todayControls.handleGripMouseDown(
        threeTasks[1],
        EditMode.DRAG_AND_SHIFT_OTHERS,
      );
      moveCursorTo("03:00");
      moveCursorTo("01:00");

      expect(get(displayedTasks)).toMatchObject({
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
      const tasks: DayToTasks = {
        [dayKey]: {
          withTime: threeTasks,
          noTime: [],
        },
      };

      const { todayControls, moveCursorTo, displayedTasks } = setUp({
        tasks,
      });

      todayControls.handleGripMouseDown(
        threeTasks[1],
        EditMode.DRAG_AND_SHRINK_OTHERS,
      );
      moveCursorTo("03:00");

      expect(get(displayedTasks)).toMatchObject({
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
