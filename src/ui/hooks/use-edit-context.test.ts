import { enableMapSet, produce } from "immer";
import moment, { Moment } from "moment";
import { get, writable } from "svelte/store";

import { ObsidianFacade } from "../../service/obsidian-facade";
import { defaultSettingsForTests } from "../../settings";
import { TasksForDay } from "../../types";
import { timeToMinutes } from "../../util/moment";

import { baseTask } from "./test-utils";
import { useEditContext } from "./use-edit-context";

enableMapSet();

const day = moment("2023-01-01");
const nextDay = moment("2023-01-02");

const baseTasks = new Map<Moment, TasksForDay>([
  [day, { withTime: [baseTask], noTime: [] }],
  [nextDay, { withTime: [], noTime: [] }],
]);

const secondTask = {
  ...baseTask,
  startMinutes: timeToMinutes("01:10"),
  durationMinutes: 60,
  id: "2",
};

const twoTasksInColumn = produce(baseTasks, (draft) => {
  draft.get(day).withTime.push(secondTask);
});

function createTaskSourceStub(tasks: Map<Moment, TasksForDay>) {
  return (day: Moment) => {
    if (tasks.has(day)) {
      return tasks.get(day);
    }

    throw new Error(`Stub tasks not provided for day: ${day}`);
  };
}

function createProps({ tasks } = { tasks: baseTasks }) {
  const pointerOffsetY = writable(0);
  const onUpdate = jest.fn();
  const obsidianFacade = jest.fn() as unknown as ObsidianFacade;
  const getTasksForDay = createTaskSourceStub(tasks);

  function movePointerTo(time: string) {
    pointerOffsetY.set(timeToMinutes(time));
  }

  return {
    getTasksForDay,
    pointerOffsetY,
    settings: defaultSettingsForTests,
    fileSyncInProgress: writable(false),
    onUpdate,
    movePointerTo,
    obsidianFacade,
  };
}

describe("drag one & common edit mechanics", () => {
  test("with no edit in progress, tasks don't change", () => {
    const props = createProps();
    const { pointerOffsetY, getTasksForDay } = props;

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks } = getEditHandlers(day);

    pointerOffsetY.set(200);

    expect(get(displayedTasks)).toEqual(getTasksForDay(day));
  });

  test("when drag starts, target task reacts to cursor", () => {
    const props = createProps();
    const { movePointerTo } = props;

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks, handleGripMouseDown } = getEditHandlers(day);

    handleGripMouseDown({} as MouseEvent, baseTask);
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
    const props = createProps();
    const { movePointerTo } = props;

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks, handleGripMouseDown, confirmEdit } =
      getEditHandlers(day);

    handleGripMouseDown({} as MouseEvent, baseTask);
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

describe("drag many", () => {
  test("tasks below react to shifting selected task once they start overlap", () => {
    const { movePointerTo, ...props } = createProps({
      tasks: twoTasksInColumn,
    });
    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks, handleGripMouseDown } = getEditHandlers(day);

    handleGripMouseDown({ ctrlKey: true } as MouseEvent, baseTask);
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
    const { movePointerTo, ...props } = createProps({
      tasks: twoTasksInColumn,
    });
    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks, handleGripMouseDown } = getEditHandlers(day);

    handleGripMouseDown({ ctrlKey: true } as MouseEvent, baseTask);
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
    const earlyTask = {
      ...baseTask,
      startMinutes: timeToMinutes("01:00"),
      durationMinutes: 60,
      id: "1",
    };
    const lateTask = {
      ...baseTask,
      startMinutes: timeToMinutes("02:00"),
      durationMinutes: 60,
      id: "2",
    };

    const tasks = produce(baseTasks, (draft) => {
      draft.get(day).withTime = [earlyTask, lateTask];
    });

    const { movePointerTo, ...props } = createProps({ tasks });

    const { getEditHandlers } = useEditContext(props);
    const { displayedTasks, handleGripMouseDown } = getEditHandlers(day);

    handleGripMouseDown({ ctrlKey: true } as MouseEvent, lateTask);
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
  test.todo("drag-many works across columns");
});

describe("moving tasks between containers", () => {
  test("the task gets moved to another container", () => {
    const props = createProps();

    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks: tasksForDay, handleGripMouseDown } =
      getEditHandlers(day);
    const {
      displayedTasks: tasksForNextDay,
      handleMouseEnter: moveMouseToNextDay,
    } = getEditHandlers(nextDay);

    handleGripMouseDown({} as MouseEvent, baseTask);
    moveMouseToNextDay();

    expect(get(tasksForDay).withTime).toHaveLength(0);
    expect(get(tasksForNextDay).withTime).toHaveLength(1);
  });

  test("the task reacts to mouse movement in another container", () => {
    const props = createProps();
    const { movePointerTo } = props;

    const { getEditHandlers } = useEditContext(props);

    const { handleGripMouseDown } = getEditHandlers(day);
    const {
      displayedTasks: displayedTasksForNextDay,
      handleMouseEnter: moveMouseToNextDay,
    } = getEditHandlers(nextDay);

    handleGripMouseDown({} as MouseEvent, baseTask);
    moveMouseToNextDay();
    movePointerTo("9:00");

    const {
      withTime: [task],
    } = get(displayedTasksForNextDay);

    expect(task).toMatchObject({
      startMinutes: timeToMinutes("09:00"),
    });
  });

  test.skip.each([
    ["handleResizeStart", false],
    ["handleGripMouseDown", true],
    ["startScheduling", true],
  ])(
    "the task moves to another container only for certain operations",
    (
      editMode: keyof ReturnType<
        ReturnType<typeof useEditContext>["getEditHandlers"]
      >,
      shouldMove: boolean,
    ) => {
      const props = createProps();

      const { getEditHandlers } = useEditContext(props);

      const { displayedTasks: tasksForDay, ...handlers } = getEditHandlers(day);
      const {
        displayedTasks: tasksForNextDay,
        handleMouseEnter: moveMouseToNextDay,
      } = getEditHandlers(nextDay);

      handlers[editMode]({} as MouseEvent, baseTask);
      moveMouseToNextDay();

      const [lengthOfTasksForDay, lengthOfTasksForNextDay] = shouldMove
        ? [0, 1]
        : [1, 0];

      expect(get(tasksForDay).withTime).toHaveLength(lengthOfTasksForDay);
      expect(get(tasksForNextDay).withTime).toHaveLength(
        lengthOfTasksForNextDay,
      );
    },
  );
});
