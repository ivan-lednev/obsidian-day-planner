import { get, writable } from "svelte/store";

import { defaultSettingsForTests } from "../../../settings";
import { timeToMinutes } from "../../../util/moment";
import { basePlanItem } from "../test-utils";

import { EditMode } from "./types";
import { useEdit } from "./use-edit";

const baseTasks = [basePlanItem];

function createProps({ tasks } = { tasks: baseTasks }) {
  const pointerOffsetY = writable(0);

  function movePointerTo(time: string) {
    pointerOffsetY.set(timeToMinutes(time));
  }

  return {
    pointerOffsetY,
    parsedTasks: tasks,
    settings: writable(defaultSettingsForTests),
    onUpdate: () => Promise.resolve(),
    movePointerTo,
  };
}

describe("drag one & common edit mechanics", () => {
  test("with no edit in progress, tasks don't change", () => {
    const props = createProps();
    const { pointerOffsetY } = props;

    const { displayedTasks } = useEdit(props);

    pointerOffsetY.set(200);

    expect(get(displayedTasks)).toEqual(baseTasks);
  });

  test("when drag starts, target task reacts to cursor", () => {
    const { movePointerTo, ...props } = createProps();

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG });
    movePointerTo("09:00");

    const [updatedItem] = get(displayedTasks);

    expect(updatedItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      durationMinutes: 60,
    });
  });

  test("after edit confirmation, tasks freeze and stop reacting to cursor", () => {
    const { movePointerTo, ...props } = createProps();

    const { displayedTasks, startEdit, confirmEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG });
    movePointerTo("09:00");
    confirmEdit();
    movePointerTo("10:00");

    const [updatedItem] = get(displayedTasks);

    expect(updatedItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      durationMinutes: 60,
    });
  });
});

describe("drag many", () => {
  test("tasks below react to shifting selected task once they start overlap", () => {
    const tasks = [
      basePlanItem,
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("01:10"),
        durationMinutes: 60,
        id: "2",
      },
    ];

    const { movePointerTo, ...props } = createProps({ tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    movePointerTo("01:10");

    const [, next] = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: timeToMinutes("02:10"),
      durationMinutes: 60,
    });
  });

  test("tasks below stay in initial position once the overlap is reversed", () => {
    const tasks = [
      basePlanItem,
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("01:10"),
        durationMinutes: 60,
        id: "2",
      },
    ];

    const { movePointerTo, ...props } = createProps({ tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    movePointerTo("01:10");
    movePointerTo("00:00");

    const [, next] = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: timeToMinutes("01:10"),
      durationMinutes: 60,
    });
  });

  test("tasks above react to shifting in the same way", () => {
    const tasks = [
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("01:00"),
        durationMinutes: 60,
        id: "1",
      },
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("02:00"),
        durationMinutes: 60,
        id: "2",
      },
    ];

    const { movePointerTo, ...props } = createProps({ tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: tasks[1], mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    movePointerTo("01:30");

    const [previous, edited] = get(displayedTasks);

    expect(edited).toMatchObject({
      startMinutes: timeToMinutes("01:30"),
      durationMinutes: 60,
    });
    expect(previous).toMatchObject({
      startMinutes: timeToMinutes("00:30"),
      durationMinutes: 60,
    });
  });

  test.todo("tasks stop moving once there is not enough time");
});

describe("create", () => {
  test.skip("create a task", () => {
    const { movePointerTo, ...props } = createProps();

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG });
    movePointerTo("09:00");

    const [createdItem] = get(displayedTasks);

    expect(createdItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      durationMinutes: 30,
    });
  });
});
