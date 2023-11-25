import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";

import { emptyTasks, nextDayKey, unscheduledTask } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("Finding diff before writing updates to files", () => {
  test("Finds tasks moved between days", async () => {
    const { todayControls, nextDayControls, confirmEdit, props } = setUp();

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updated: [
          expect.objectContaining({
            id: baseTask.id,
            firstLineText: expect.stringContaining(`⌛ ${nextDayKey}`),
          }),
        ],
      }),
    );
  });

  test("Finds created tasks", async () => {
    const { todayControls, confirmEdit, props } = setUp({
      tasks: emptyTasks,
    });

    todayControls.handleContainerMouseDown();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        created: [expect.objectContaining({ startMinutes: 0 })],
        updated: [],
      }),
    );
  });

  test("Finds tasks moved within one day", async () => {
    const { todayControls, confirmEdit, props, moveCursorTo } = setUp();

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    moveCursorTo("2:00");

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updated: [
          expect.objectContaining({
            startMinutes: toMinutes("2:00"),
          }),
        ],
        created: [],
      }),
    );
  });

  test("Finds newly scheduled tasks", async () => {
    const { todayControls, confirmEdit, props, moveCursorTo } = setUp({
      tasks: unscheduledTask,
    });

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    moveCursorTo("2:00");

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        created: [],
        updated: [
          expect.objectContaining({
            startMinutes: toMinutes("2:00"),
          }),
        ],
      }),
    );
  });
});
