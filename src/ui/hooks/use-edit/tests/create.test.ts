import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { useEditContext } from "../use-edit-context";

import { day, emptyTasks } from "./util/fixtures";
import { createProps, setPointerTime } from "./util/setup";

describe("create", () => {
  test("when creating and dragging, task duration changes", async () => {
    const props = createProps({ tasks: emptyTasks });

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks, handleMouseDown, pointerOffsetY } =
      getEditHandlers(day);

    setPointerTime(pointerOffsetY, "01:30");
    handleMouseDown();
    setPointerTime(pointerOffsetY, "02:30");

    const {
      withTime: [newTask],
    } = get(displayedTasks);

    expect(newTask).toMatchObject({
      startMinutes: toMinutes("01:30"),
      durationMinutes: 60,
    });
  });
});
