import moment from "moment";
import { get } from "svelte/store";

import { dayKey, nextDayKey } from "./util/fixtures";
import { setUp } from "./util/setup";
import { baseTask, threeTasks } from "./util/test-utils";
import { EditMode } from "../../src/ui/hooks/use-edit/types";

// todo: remove duplication, ideally this check should be pulled out of the diffing logic
jest.mock("obsidian-daily-notes-interface", () => ({
  ...jest.requireActual("obsidian-daily-notes-interface"),
  getDateFromPath(): null {
    return null;
  },
}));

describe("drag one & common edit mechanics", () => {
  test("Splits multi-day tasks into single-day tasks", () => {
    const { dayToDisplayedTasks } = setUp({
      tasks: [
        {
          ...baseTask,
          startTime: moment("2023-01-01 23:00"),
          durationMinutes: 120,
          id: "1",
        },
      ],
    });

    expect(get(dayToDisplayedTasks)).toMatchObject({
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

  test("after edit confirmation, tasks freeze and stop reacting to cursor", async () => {
    const {
      todayControls,
      nextDayControls,
      moveCursorTo,
      dayToDisplayedTasks,
      confirmEdit,
    } = setUp({
      tasks: threeTasks,
    });

    todayControls.handleGripMouseDown(threeTasks[1], EditMode.DRAG);
    moveCursorTo("03:00");

    await confirmEdit();

    nextDayControls.handleMouseEnter();
    moveCursorTo("05:00");

    expect(get(dayToDisplayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { id: "1" },
          { id: "2", startTime: moment("2023-01-01 03:00") },
          { id: "3" },
        ],
      },
    });
  });

  test.skip("when a task is set to its current time, nothing happens", async () => {
    const { todayControls, confirmEdit, props } = setUp();

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    await confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });
});
