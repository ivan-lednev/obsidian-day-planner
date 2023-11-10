import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
import { useEditContext } from "../use-edit-context";

import { day } from "./util/fixtures";
import { createProps, setPointerTime, setUp } from "./util/setup";

describe("drag one & common edit mechanics", () => {
  test("with no edit in progress, tasks don't change", () => {
    const { moveCursorTo, todayControls } = setUp();

    moveCursorTo("8:00");

    const {
      withTime: [task],
    } = get(todayControls.displayedTasks);

    expect(task).toMatchObject({
      startMinutes: toMinutes("00:00"),
      durationMinutes: 60,
    });
  });

  test("when drag starts, target task reacts to cursor", () => {
    const { moveCursorTo, todayControls } = setUp();

    todayControls.handleGripMouseDown({} as MouseEvent, baseTask);
    moveCursorTo("09:00");

    const {
      withTime: [updatedTask],
    } = get(todayControls.displayedTasks);

    expect(updatedTask).toMatchObject({
      startMinutes: toMinutes("09:00"),
      durationMinutes: 60,
    });
  });

  test("after edit confirmation, tasks freeze and stop reacting to cursor", () => {
    const props = createProps();

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks, handleGripMouseDown, confirmEdit, pointerOffsetY } =
      getEditHandlers(day);

    handleGripMouseDown({} as MouseEvent, baseTask);
    setPointerTime(pointerOffsetY, "09:00");
    confirmEdit();
    setPointerTime(pointerOffsetY, "10:00");

    const {
      withTime: [updatedItem],
    } = get(displayedTasks);

    expect(updatedItem).toMatchObject({
      startMinutes: toMinutes("09:00"),
      durationMinutes: 60,
    });
    expect(props.onUpdate).toHaveBeenCalled();
  });

  test("when a task is set to its current time, nothing happens", () => {
    const props = createProps();

    const { getEditHandlers } = useEditContext(props);
    const { handleGripMouseDown, confirmEdit } = getEditHandlers(day);

    handleGripMouseDown({} as MouseEvent, baseTask);
    confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });
});
