import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
import { EditMode } from "../types";

import { dayKey } from "./util/fixtures";
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
    } = setUp();

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    moveCursorTo("01:00");
    await confirmEdit();
    nextDayControls.handleMouseEnter();
    moveCursorTo("03:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ startMinutes: toMinutes("01:00") }],
      },
    });
  });

  test("when a task is set to its current time, nothing happens", async () => {
    const { todayControls, confirmEdit, props } = setUp();

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    await confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });
});
