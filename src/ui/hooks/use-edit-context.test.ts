import moment, { Moment } from "moment";
import { get, writable } from "svelte/store";

import { ObsidianFacade } from "../../service/obsidian-facade";
import { defaultSettingsForTests } from "../../settings";
import { TasksForDay } from "../../types";
import { timeToMinutes } from "../../util/moment";

import { baseTask } from "./test-utils";
import { useEditContext } from "./use-edit-context";

const day = moment("2023-01-01");
const nextDay = moment("2023-01-02");

function createTaskSourceStub() {
  const tasksForDay = new Map<Moment, TasksForDay>([
    [day, { withTime: [baseTask], noTime: [] }],
    [nextDay, { withTime: [], noTime: [] }],
  ]);

  return (day: Moment) => {
    if (tasksForDay.has(day)) {
      return tasksForDay.get(day);
    }

    throw new Error(`Stub tasks not provided for day: ${day}`);
  };
}

function createProps() {
  const pointerOffsetY = writable(0);
  const onUpdate = jest.fn();
  const obsidianFacade = jest.fn() as unknown as ObsidianFacade;
  const getTasksForDay = createTaskSourceStub();

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

describe("moving tasks between containers", () => {
  test("when the pointer hovers over another column, the task gets moved there and removed from its original column", () => {
    const props = createProps();

    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks: displayedTasksForDay, handleGripMouseDown } =
      getEditHandlers(day);
    const {
      displayedTasks: displayedTasksForNextDay,
      handleMouseEnter: moveMouseToNextDay,
    } = getEditHandlers(nextDay);

    handleGripMouseDown({} as MouseEvent, baseTask);
    moveMouseToNextDay();

    expect(get(displayedTasksForDay).withTime).toHaveLength(0);
    expect(get(displayedTasksForNextDay).withTime).toHaveLength(1);
  });

  test("when the pointer hovers over another column, the task reacts to mouse movement", () => {
    const props = createProps();
    const { movePointerTo } = props;

    const { getEditHandlers } = useEditContext(props);

    const { displayedTasks: displayedTasksForDay, handleGripMouseDown } =
      getEditHandlers(day);
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
});
