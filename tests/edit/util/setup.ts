import { noop } from "lodash/fp";
import type { Moment } from "moment/moment";
import { writable } from "svelte/store";

import { WorkspaceFacade } from "../../../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import type { LocalTask } from "../../../src/task-types";
import { toMinutes } from "../../../src/util/moment";

import { baseTasks, day, nextDay } from "./fixtures";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";

function createProps({
  tasks,
  settings,
}: {
  tasks: LocalTask[];
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
  const { getEditHandlers, dayToDisplayedTasks, confirmEdit, pointerOffsetY } =
    useEditContext(props);

  const todayControls = getEditHandlers(day);
  const nextDayControls = getEditHandlers(nextDay);

  // this prevents the store from resetting;
  dayToDisplayedTasks.subscribe(noop);

  function moveCursorTo(time: string, day?: Moment) {
    pointerOffsetY.set(toMinutes(time));
  }

  return {
    todayControls,
    nextDayControls,
    moveCursorTo,
    dayToDisplayedTasks,
    confirmEdit,
    props,
  };
}
