import { get } from "svelte/store";

import { Tasks } from "../../../../types";
import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";

import { dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("resize", () => {
  test("resizing changes duration", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp();

    todayControls.handleResizeStart({} as MouseEvent, baseTask);
    moveCursorTo("03:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ durationMinutes: 180 }],
      },
    });
  });

  describe("resize many", () => {
    test("resizing with neighbors shifts neighbors as well", () => {
      const middleTask = {
        ...baseTask,
        id: "2",
        startMinutes: toMinutes("02:00"),
      };

      const tasks: Tasks = {
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

      todayControls.handleResizeStart(
        { ctrlKey: true } as MouseEvent,
        middleTask,
      );
      moveCursorTo("04:00");

      expect(get(displayedTasks)).toMatchObject({
        [dayKey]: {
          withTime: [
            { id: "1", startMinutes: toMinutes("01:00") },
            { id: "2", startMinutes: toMinutes("02:00") },
            { id: "3", startMinutes: toMinutes("04:00") },
          ],
        },
      });
    });
  });
});
