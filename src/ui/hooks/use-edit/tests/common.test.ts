import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
import { useEditContext } from "../use-edit-context";

import { day, dayKey } from "./util/fixtures";
import {
  createProps,
  setPointerTime,
  setUp_MULTIDAY,
} from "./util/setup";

describe("drag one & common edit mechanics", () => {
  test("when drag starts, target task reacts to cursor", () => {
    const { todayControls, moveCursorTo, displayedTasks } = setUp_MULTIDAY();

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
