import { noop } from "lodash/fp";
import type { Moment } from "moment/moment";
import { writable } from "svelte/store";
import { vi } from "vitest";

import { WorkspaceFacade } from "../../../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import type { LocalTask } from "../../../src/task-types";
import { useEditContext } from "../../../src/ui/hooks/use-edit/use-edit-context";
import { minutesToMomentOfDay, toMinutes } from "../../../src/util/moment";

import { baseTasks, day, nextDay } from "./fixtures";
import { offsetYToMinutes } from "../../../src/util/task-utils";
import moment from "moment/moment";

function createProps({
  tasks,
  settings,
}: {
  tasks: LocalTask[];
  settings: DayPlannerSettings;
}) {
  const onUpdate = vi.fn();
  const workspaceFacade = vi.fn() as unknown as WorkspaceFacade;

  return {
    settings: writable(settings),
    onUpdate,
    workspaceFacade,
    localTasks: writable(tasks),
    remoteTasks: writable([]),
    pointerDateTime: writable({ dateTime: moment("2023-01-01 00:00") }),
  };
}

export function setUp({
  tasks = baseTasks,
  settings = defaultSettingsForTests,
} = {}) {
  const props = createProps({ tasks, settings });
  const { getEditHandlers, dayToDisplayedTasks, confirmEdit, } =
    useEditContext(props);

  const todayControls = getEditHandlers(day);
  const nextDayControls = getEditHandlers(nextDay);

  // this prevents the store from resetting;
  dayToDisplayedTasks.subscribe(noop);

  // todo: -> dateTime: moment
  function moveCursorTo(time: string, day: Moment) {
    const newDateTime = day.clone().startOf("day").add(moment.duration(time));

    props.pointerDateTime.set({
      dateTime: newDateTime,
    });
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
