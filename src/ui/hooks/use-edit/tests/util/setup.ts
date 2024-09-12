import { noop } from "lodash/fp";
import type { Moment } from "moment/moment";
import { writable } from "svelte/store";

import { ObsidianFacade } from "../../../../../service/obsidian-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../../../settings";
import type { DayToTasks } from "../../../../../task-types";
import { toMinutes } from "../../../../../util/moment";
import { useEditContext } from "../../use-edit-context";

import { baseTasks, day, nextDay } from "./fixtures";

function createProps({
  tasks,
  settings,
}: {
  tasks: DayToTasks;
  settings: DayPlannerSettings;
}) {
  const onUpdate = jest.fn();
  const obsidianFacade = jest.fn() as unknown as ObsidianFacade;

  return {
    settings: writable(settings),
    onUpdate,
    obsidianFacade,
    visibleTasks: writable(tasks),
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
