import { get } from "svelte/store";

import { defaultSettingsForTests } from "../../../../settings";
import type { DayToTasks } from "../../../../task-types";
import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
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
        withTime: [{ startMinutes: toMinutes("01:00") }],
      },
    });
  });

  describe("drag many", () => {
    test("tasks below react to shifting selected task once there is overlap", () => {
      const middleTask = {
        ...baseTask,
        id: "2",
        startMinutes: toMinutes("02:00"),
      };

      const tasks: DayToTasks = {
        [dayKey]: {
          withTime: [
            { ...baseTask, id: "1", startMinutes: toMinutes("01:00") },
            middleTask,
            { ...baseTask, id: "3", startMinutes: toMinutes("03:00") },
          ],
          noTime: [],
        },
      };

      const { todayControls, moveCursorTo, displayedTasks } = setUp({
        tasks,
      });

      todayControls.handleGripMouseDown(
        middleTask,
        EditMode.DRAG_AND_SHIFT_OTHERS,
      );
      moveCursorTo("03:00");

      expect(get(displayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { id: "1", startMinutes: toMinutes("01:00") },
            { id: "2", startMinutes: toMinutes("03:00") },
            { id: "3", startMinutes: toMinutes("04:00") },
          ],
        },
      });
    });

    test("tasks below stay in initial position once the overlap is reversed, tasks above shift as well", () => {
      const middleTask = {
        ...baseTask,
        id: "2",
        startMinutes: toMinutes("02:00"),
      };

      const tasks: DayToTasks = {
        [dayKey]: {
          withTime: [
            { ...baseTask, id: "1", startMinutes: toMinutes("01:00") },
            middleTask,
            { ...baseTask, id: "3", startMinutes: toMinutes("03:00") },
          ],
          noTime: [],
        },
      };

      const { todayControls, moveCursorTo, displayedTasks } = setUp({
        tasks,
        settings: { ...defaultSettingsForTests },
      });

      todayControls.handleGripMouseDown(
        middleTask,
        EditMode.DRAG_AND_SHIFT_OTHERS,
      );
      moveCursorTo("03:00");
      moveCursorTo("01:00");

      expect(get(displayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { id: "1", startMinutes: toMinutes("00:00") },
            { id: "2", startMinutes: toMinutes("01:00") },
            { id: "3", startMinutes: toMinutes("03:00") },
          ],
        },
      });
    });

    test.skip("tasks stop moving once there is not enough time", () => {
      const tasks: DayToTasks = {
        [dayKey]: {
          withTime: [
            baseTask,
            { ...baseTask, id: "2", startMinutes: toMinutes("03:00") },
          ],
          noTime: [],
        },
      };

      const { todayControls, moveCursorTo, displayedTasks } = setUp({
        tasks,
      });

      todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
      moveCursorTo("21:00");

      expect(get(displayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { startMinutes: toMinutes("21:00") },
            { startMinutes: toMinutes("22:00") },
          ],
        },
      });

      moveCursorTo("22:00");

      expect(get(displayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { startMinutes: toMinutes("21:00") },
            { startMinutes: toMinutes("22:00") },
          ],
        },
      });
    });
  });
});
