import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { dayKey, emptyTasks } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("create", () => {
  test("when creating and dragging, task duration changes", () => {
    const { handlers, moveCursorTo, dayToDisplayedTasks } = setUp({
      tasks: emptyTasks,
    });

    moveCursorTo(moment("2023-01-01 01:00"));
    handlers.handleContainerMouseDown();
    moveCursorTo(moment("2023-01-01 02:00"));

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          {
            startTime: moment("2023-01-01 01:00"),
            durationMinutes: 60,
          },
        ],
      },
    });
  });
});
