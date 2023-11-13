import { baseTask } from "../../test-utils";

import { setUp } from "./util/setup";
import { day, nextDay } from "./util/fixtures";

describe("Finding diff before writing updates to files", () => {
  test("Finds tasks moved between days", async () => {
    const { todayControls, nextDayControls, confirmEdit, props } = setUp();

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedDay: [expect.objectContaining({ id: "id", startTime: nextDay })],
      }),
    );
  });

  test.todo("Finds created tasks");

  test.todo("Finds tasks moved within one day");
});
