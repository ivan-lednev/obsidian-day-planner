import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";

import { oneUnscheduledTask } from "./util/fixtures";
import { setPointerTime, setUp } from "./util/setup";

describe("schedule", () => {
  test("when grabbing an unscheduled task, it moves with the cursor in the scheduled section", () => {
    const { todayControls } = setUp({ tasks: oneUnscheduledTask });

    todayControls.startScheduling(baseTask);
    setPointerTime(todayControls.pointerOffsetY, "02:30");

    const {
      withTime: [newTask],
    } = get(todayControls.displayedTasks);

    expect(newTask).toMatchObject({
      startMinutes: toMinutes("02:30"),
      durationMinutes: 60,
    });
  });
});
