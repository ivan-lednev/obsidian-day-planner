import { noop } from "lodash/fp";
import type { Moment } from "moment/moment";
import { writable } from "svelte/store";

import { WorkspaceFacade } from "../../../../../service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../../../settings";
import type { Task } from "../../../../../task-types";
import { toMinutes } from "../../../../../util/moment";
import { useEditContext } from "../../use-edit-context";

import { baseTasks, day, nextDay } from "./fixtures";

function createProps({
  tasks,
  settings,
}: {
  tasks: Task[];
  settings: DayPlannerSettings;
}) {
  const onUpdate = jest.fn();
  const workspaceFacade = jest.fn() as unknown as WorkspaceFacade;

  return {
    settings: writable(settings),
    onUpdate,
    workspaceFacade,
    localTasks: writable(tasks),
    remoteTasks: writable([]),
  };
}

export function setUp({
  tasks = baseTasks,
  settings = defaultSettingsForTests,
} = {}) {
  const props = createProps({ tasks, settings });
  const { getEditHandlers, displayedTasks, confirmEdit, pointerOffsetY } =
    useEditContext(props);

  const todayControls = getEditHandlers(day);
  const nextDayControls = getEditHandlers(nextDay);

  // this prevents the store from resetting;
  displayedTasks.subscribe(noop);

  function moveCursorTo(time: string, day?: Moment) {
    pointerOffsetY.set(toMinutes(time));
  }

  return {
    todayControls,
    nextDayControls,
    moveCursorTo,
    displayedTasks,
    confirmEdit,
    props,
  };
}
