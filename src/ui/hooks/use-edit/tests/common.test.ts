import moment from "moment";
import { get } from "svelte/store";

import { baseTask, threeTasks } from "../../test-utils";
import { EditMode } from "../types";

import { dayKey, nextDayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

// todo: remove duplication, ideally this check should be pulled out of the diffing logic
jest.mock("obsidian-daily-notes-interface", () => ({
  ...jest.requireActual("obsidian-daily-notes-interface"),
  getDateFromPath(): null {
    return null;
  },
}));

describe("drag one & common edit mechanics", () => {
  test("after edit confirmation, tasks freeze and stop reacting to cursor", async () => {
    const {
      todayControls,
      nextDayControls,
      moveCursorTo,
      displayedTasks,
      confirmEdit,
    } = setUp({
      tasks: {
        [dayKey]: {
          withTime: threeTasks,
          noTime: [],
        },
        [nextDayKey]: {
          withTime: [],
          noTime: [],
        },
      },
    });

    todayControls.handleGripMouseDown(threeTasks[1], EditMode.DRAG);
    moveCursorTo("03:00");

    await confirmEdit();

    nextDayControls.handleMouseEnter();
    moveCursorTo("03:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [
          { id: "1" },
          { id: "2", startTime: moment("2023-01-01 03:00") },
          { id: "3" },
        ],
      },
      [nextDayKey]: {
        withTime: [],
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
