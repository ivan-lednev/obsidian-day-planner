import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";

import { dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("drag one & common edit mechanics", () => {
  test("when drag starts, target task reacts to cursor", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp();

    todayControls.handleMouseEnter();
    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    moveCursorTo("01:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ startMinutes: toMinutes("01:00") }],
      },
    });
  });

  test("after edit confirmation, tasks freeze and stop reacting to cursor", () => {
    const {
      todayControls,
      nextDayControls,
      moveCursorTo,
      displayedTasks,
      confirmEdit,
    } = setUp();

    todayControls.handleMouseEnter();
    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    moveCursorTo("01:00");
    confirmEdit();
    nextDayControls.handleMouseEnter();
    moveCursorTo("03:00");

    expect(get(displayedTasks)).toMatchObject({
      [dayKey]: {
        withTime: [{ startMinutes: toMinutes("01:00") }],
      },
    });
  });

  test("when a task is set to its current time, nothing happens", () => {
    const { todayControls, confirmEdit, props } = setUp();

    todayControls.handleMouseEnter();
    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });
});
