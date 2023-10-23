import { get, writable } from "svelte/store";

import { defaultSettingsForTests } from "../../../settings";
import { timeToMinutes } from "../../../util/moment";
import { basePlanItem } from "../test-utils";

import { EditMode } from "./types";
import { useEdit } from "./use-edit";
import { TasksForDay } from "../../../types";

const baseTasksForDay: TasksForDay = {
  withTime: [basePlanItem],
  noTime: [],
};

function createProps({ tasks } = { tasks: baseTasksForDay }) {
  const pointerOffsetY = writable(0);

  function movePointerTo(time: string) {
    pointerOffsetY.set(timeToMinutes(time));
  }

  return {
    pointerOffsetY,
    tasks,
    settings: writable(defaultSettingsForTests),
    fileSyncInProgress: writable(false),
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

    expect(get(displayedTasks)).toEqual(baseTasksForDay);
  });

  test("when drag starts, target task reacts to cursor", () => {
    const { movePointerTo, ...props } = createProps();

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG });
    movePointerTo("09:00");

    const {
      withTime: [updatedItem],
    } = get(displayedTasks);

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

    const {
      withTime: [updatedItem],
    } = get(displayedTasks);

    expect(updatedItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      durationMinutes: 60,
    });
  });
});

describe("drag many", () => {
  test("tasks below react to shifting selected task once they start overlap", () => {
    const tasks = {
      ...baseTasksForDay,
      withTime: [
        basePlanItem,
        {
          ...basePlanItem,
          startMinutes: timeToMinutes("01:10"),
          durationMinutes: 60,
          id: "2",
        },
      ],
    };

    const { movePointerTo, ...props } = createProps({ tasks: tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    movePointerTo("01:10");

    const {
      withTime: [, next],
    } = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: timeToMinutes("02:10"),
      durationMinutes: 60,
    });
  });

  test("tasks below stay in initial position once the overlap is reversed", () => {
    const tasks = {
      ...baseTasksForDay,
      withTime: [
        basePlanItem,
        {
          ...basePlanItem,
          startMinutes: timeToMinutes("01:10"),
          durationMinutes: 60,
          id: "2",
        },
      ],
    };

    const { movePointerTo, ...props } = createProps({ tasks: tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    movePointerTo("01:10");
    movePointerTo("00:00");

    const {
      withTime: [, next],
    } = get(displayedTasks);

    expect(next).toMatchObject({
      startMinutes: timeToMinutes("01:10"),
      durationMinutes: 60,
    });
  });

  test("tasks above react to shifting in the same way", () => {
    const tasks = {
      ...baseTasksForDay,
      withTime: [
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
      ],
    };

    const { movePointerTo, ...props } = createProps({ tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({
      task: tasks.withTime[1],
      mode: EditMode.DRAG_AND_SHIFT_OTHERS,
    });
    movePointerTo("01:30");

    const {
      withTime: [previous, edited],
    } = get(displayedTasks);

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

// todo: why is it skipped?
describe("create", () => {
  test.skip("create a task", () => {
    const { movePointerTo, ...props } = createProps();

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: basePlanItem, mode: EditMode.DRAG });
    movePointerTo("09:00");

    const {
      withTime: [createdItem],
    } = get(displayedTasks);

    expect(createdItem).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
      durationMinutes: 30,
    });
  });
});

describe("schedule", () => {
  test("base case", () => {
    const tasks: TasksForDay = {
      noTime: [basePlanItem],
      withTime: [],
    };

    const { movePointerTo, ...props } = createProps({ tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({
      task: tasks.noTime[0],
      mode: EditMode.SCHEDULE,
    });
    movePointerTo("01:30");

    const { noTime, withTime } = get(displayedTasks);

    expect(withTime[0]).toMatchObject({
      startMinutes: timeToMinutes("01:30"),
    });
    expect(noTime).toHaveLength(0);
  });
});
