import { produce } from "immer";
import { get } from "svelte/store";

import { toMinutes } from "../../../../util/moment";
import { baseTask } from "../../test-utils";
import { useEditContext } from "../use-edit-context";

import { baseTasks, day, dayKey, twoTasksInColumn } from "./util/fixtures";
import { createProps, setPointerTime } from "./util/setup";




describe("drag many", () => {
  test("tasks below react to shifting selected task once they start overlap", () => {
    const props = createProps({
      tasks: twoTasksInColumn,
    });
    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks, handleGripMouseDown, pointerOffsetY } =
      getEditHandlers(day);

    handleGripMouseDown({ ctrlKey: true } as MouseEvent, baseTask);
    setPointerTime(pointerOffsetY, "01:10");

    const {
      withTime: [, next],
    } = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: toMinutes("02:10"),
      durationMinutes: 60,
    });
  });

  test("tasks below stay in initial position once the overlap is reversed", () => {
    const props = createProps({
      tasks: twoTasksInColumn,
    });
    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks, handleGripMouseDown, pointerOffsetY } =
      getEditHandlers(day);

    handleGripMouseDown({ ctrlKey: true } as MouseEvent, baseTask);
    setPointerTime(pointerOffsetY, "01:10");
    setPointerTime(pointerOffsetY, "00:00");

    const {
      withTime: [, next],
    } = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: toMinutes("01:10"),
      durationMinutes: 60,
    });
  });

  test("tasks above react to shifting in the same way", () => {
    const earlyTask = {
      ...baseTask,
      startMinutes: toMinutes("01:00"),
      durationMinutes: 60,
      id: "1",
    };
    const lateTask = {
      ...baseTask,
      startMinutes: toMinutes("02:00"),
      durationMinutes: 60,
      id: "2",
    };

    const tasks = produce(baseTasks, (draft) => {
      draft[dayKey].withTime = [earlyTask, lateTask];
    });

    const props = createProps({ tasks });

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks, handleGripMouseDown, pointerOffsetY } =
      getEditHandlers(day);

    handleGripMouseDown({ ctrlKey: true } as MouseEvent, lateTask);
    setPointerTime(pointerOffsetY, "01:30");

    const {
      withTime: [previous, edited],
    } = get(displayedTasks);

    expect(edited).toMatchObject({
      startMinutes: toMinutes("01:30"),
      durationMinutes: 60,
    });
    expect(previous).toMatchObject({
      startMinutes: toMinutes("00:30"),
      durationMinutes: 60,
    });
  });

  test.todo("tasks stop moving once there is not enough time");
  test.todo("drag-many works across columns");
});
