import { baseTask } from "../../test-utils";

import { setUp } from "./util/setup";

describe("Finding diff before writing updates to files", () => {
  test("Finds tasks moved between days", async () => {
    const { todayControls, nextDayControls, moveCursorTo, confirmEdit, props } =
      setUp();

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();
    moveCursorTo("02:00");

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith({
      moved: [],
    });
  });
});
