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
    settings: defaultSettingsForTests,
    fileSyncInProgress: writable(false),
    onUpdate,
    movePointerTo,
  };
}

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
