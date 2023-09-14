import { get, writable } from "svelte/store";

import { settingsWithUtils } from "../../../global-stores/settings-with-utils";
import { timeToMinutes } from "../../../util/moment";
import { basePlanItem } from "../test-utils";

import { EditMode } from "./types";
import { useEdit } from "./use-edit";

const baseTasks = [basePlanItem];

function getUseEditProps({ tasks } = { tasks: baseTasks }) {
  const pointerOffsetY = writable(0);
  return {
    pointerOffsetY,
    parsedTasks: tasks,
    settings: settingsWithUtils.settings,
    onUpdate: () => Promise.resolve(),
  };
}

describe("drag one & common edit mechanics", () => {
  test("with no edit in progress, tasks don't change", () => {
    const props = getUseEditProps();
    const { pointerOffsetY } = props;

    const { displayedTasks } = useEdit(props);

    pointerOffsetY.set(200);

    expect(get(displayedTasks)).toEqual(baseTasks);
  });

  test("when drag starts, target task reacts to cursor", () => {
    const props = getUseEditProps();
    const { pointerOffsetY } = props;

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit(basePlanItem, EditMode.DRAG);
    pointerOffsetY.set(timeToMinutes("09:00"));

    const [updatedItem] = get(displayedTasks);

    expect(updatedItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      endMinutes: timeToMinutes("10:00"),
    });
  });

  test("after edit confirmation, tasks freeze and stop reacting to cursor", () => {
    const props = getUseEditProps();
    const { pointerOffsetY } = props;

    const { displayedTasks, startEdit, confirmEdit } = useEdit(
      getUseEditProps(),
    );

    startEdit(basePlanItem, EditMode.DRAG);
    pointerOffsetY.set(timeToMinutes("09:00"));
    confirmEdit();
    pointerOffsetY.set(timeToMinutes("10:00"));

    const [updatedItem] = get(displayedTasks);

    expect(updatedItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      endMinutes: timeToMinutes("10:00"),
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
        endMinutes: timeToMinutes("02:10"),
        id: "2",
      },
    ];

    const props = getUseEditProps({ tasks });
    const { pointerOffsetY } = props;

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit(basePlanItem, EditMode.DRAG_AND_SHIFT_OTHERS);
    pointerOffsetY.set(timeToMinutes("01:10"));

    const [, next] = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: timeToMinutes("02:10"),
      endMinutes: timeToMinutes("03:10"),
    });
  });

  test("tasks below stay in initial position once the overlap is reversed", () => {
    const tasks = [
      basePlanItem,
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("01:10"),
        endMinutes: timeToMinutes("02:10"),
        id: "2",
      },
    ];

    const props = getUseEditProps({ tasks });
    const { pointerOffsetY } = props;

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit(basePlanItem, EditMode.DRAG_AND_SHIFT_OTHERS);
    pointerOffsetY.set(timeToMinutes("01:10"));
    pointerOffsetY.set(timeToMinutes("00:00"));

    const [, next] = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: timeToMinutes("01:10"),
      endMinutes: timeToMinutes("02:10"),
    });
  });

  test("tasks above react to shifting in the same way", () => {
    const tasks = [
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("01:00"),
        endMinutes: timeToMinutes("02:00"),
        id: "1",
      },
      {
        ...basePlanItem,
        startMinutes: timeToMinutes("02:00"),
        endMinutes: timeToMinutes("03:00"),
        id: "2",
      },
    ];

    const props = getUseEditProps({ tasks });
    const { pointerOffsetY } = props;

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit(tasks[1], EditMode.DRAG_AND_SHIFT_OTHERS);
    pointerOffsetY.set(timeToMinutes("01:30"));

    const [previous, edited] = get(displayedTasks);

    expect(edited).toMatchObject({
      startMinutes: timeToMinutes("01:30"),
      endMinutes: timeToMinutes("02:30"),
    });
    expect(previous).toMatchObject({
      startMinutes: timeToMinutes("00:30"),
      endMinutes: timeToMinutes("01:30"),
    });
  });

  test.todo("tasks stop moving once there is not enough time");
});

describe("drag one with pushing neighbor", () => {});
