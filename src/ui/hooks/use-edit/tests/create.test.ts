import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";

import { dayKey, emptyTasks } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("create", () => {
  test("when creating and dragging, task duration changes", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp({
      tasks: emptyTasks,
    });

    moveCursorTo("01:00");
    todayControls.handleMouseEnter();
    todayControls.handleMouseDown();
    moveCursorTo("02:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ startMinutes: toMinutes("01:00"), durationMinutes: 60 }],
      },
    });
  });
});
