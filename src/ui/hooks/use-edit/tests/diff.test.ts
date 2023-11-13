import { baseTask } from "../../test-utils";

import { nextDayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("Finding diff before writing updates to files", () => {
  test("Finds tasks moved between days", async () => {
    const { todayControls, nextDayControls, confirmEdit, props } = setUp();

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    nextDayControls.handleMouseEnter();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedDay: expect.objectContaining({
          [nextDayKey]: [expect.objectContaining({ id: baseTask.id })],
        }),
      }),
    );
  });

  test.todo("Finds created tasks");

  test.todo("Finds tasks moved within one day");
});
