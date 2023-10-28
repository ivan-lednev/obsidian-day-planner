import { get, writable } from "svelte/store";

import { defaultSettingsForTests } from "../../../settings";
import { TasksForDay } from "../../../types";
import { timeToMinutes } from "../../../util/moment";
import { baseTask } from "../test-utils";

import { EditMode } from "./types";
import { useEdit } from "./use-edit";

const baseTasksForDay: TasksForDay = {
  withTime: [baseTask],
  noTime: [],
};

function createProps({ tasks } = { tasks: baseTasksForDay }) {
  const pointerOffsetY = writable(0);
  const onUpdate = jest.fn();

  function movePointerTo(time: string) {
    pointerOffsetY.set(timeToMinutes(time));
  }

  return {
    pointerOffsetY,
    tasks,
    settings: writable(defaultSettingsForTests),
    fileSyncInProgress: writable(false),
    onUpdate,
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

    startEdit({ task: baseTask, mode: EditMode.DRAG });
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

    startEdit({ task: baseTask, mode: EditMode.DRAG });
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

  test("when a task is set to its current time, nothing happens", () => {
    const props = createProps();

    const { startEdit, confirmEdit } = useEdit(props);

    startEdit({ task: baseTask, mode: EditMode.DRAG });
    confirmEdit();

    expect(props.onUpdate).not.toHaveBeenCalled();
  });
});

describe("drag many", () => {
  test("tasks below react to shifting selected task once they start overlap", () => {
    const tasks = {
      ...baseTasksForDay,
      withTime: [
        baseTask,
        {
          ...baseTask,
          startMinutes: timeToMinutes("01:10"),
          durationMinutes: 60,
          id: "2",
        },
      ],
    };

    const { movePointerTo, ...props } = createProps({ tasks: tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: baseTask, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
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
        baseTask,
        {
          ...baseTask,
          startMinutes: timeToMinutes("01:10"),
          durationMinutes: 60,
          id: "2",
        },
      ],
    };

    const { movePointerTo, ...props } = createProps({ tasks: tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: baseTask, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
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
          ...baseTask,
          startMinutes: timeToMinutes("01:00"),
          durationMinutes: 60,
          id: "1",
        },
        {
          ...baseTask,
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

describe("create", () => {
  test("when creating and dragging, task duration changes", () => {
    const { movePointerTo, ...props } = createProps({
      tasks: { noTime: [], withTime: [] },
    });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({ task: baseTask, mode: EditMode.CREATE });
    movePointerTo("03:00");

    const {
      withTime: [createdItem],
    } = get(displayedTasks);

    expect(createdItem).toMatchObject({
      startMinutes: timeToMinutes("00:00"),
      durationMinutes: 180,
    });
  });
});

describe("schedule", () => {
  test("base case", () => {
    const tasks: TasksForDay = {
      noTime: [baseTask],
      withTime: [],
    };

    const { movePointerTo, ...props } = createProps({ tasks });

    const { displayedTasks, startEdit } = useEdit(props);

    startEdit({
      task: baseTask,
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
