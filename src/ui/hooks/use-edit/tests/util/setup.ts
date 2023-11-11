import { Moment } from "moment/moment";
import { writable, Writable } from "svelte/store";

import { ObsidianFacade } from "../../../../../service/obsidian-facade";
import { defaultSettingsForTests } from "../../../../../settings";
import { toMinutes } from "../../../../../util/moment";
import {
  useEditContext,
  useEditContext_MULTIDAY,
} from "../../use-edit-context";

import { baseTasks, day, nextDay } from "./fixtures";

export function setPointerTime(pointerOffsetY: Writable<number>, time: string) {
  pointerOffsetY.set(toMinutes(time));
}

export function createProps({ tasks } = { tasks: baseTasks }) {
  const onUpdate = jest.fn();
  const obsidianFacade = jest.fn() as unknown as ObsidianFacade;

  return {
    settings: defaultSettingsForTests,
    fileSyncInProgress: writable(false),
    onUpdate,
    obsidianFacade,
    visibleTasks: tasks,
  };
}

export function setUp({ tasks } = { tasks: baseTasks }) {
  const props = createProps({ tasks });
  const { getEditHandlers } = useEditContext(props);

  const todayControls = getEditHandlers(day);
  const { pointerOffsetY } = todayControls;
  const nextDayControls = getEditHandlers(nextDay);

  function moveCursorTo(time: string, day?: Moment) {
    pointerOffsetY.set(toMinutes(time));
  }

  return { todayControls, nextDayControls, moveCursorTo };
}

export function setUp_MULTIDAY({ tasks } = { tasks: baseTasks }) {
  const props = createProps({ tasks });
  const { getEditHandlers, displayedTasks } = useEditContext_MULTIDAY(props);

  const todayControls = getEditHandlers(day);
  const { pointerOffsetY } = todayControls;
  const nextDayControls = getEditHandlers(nextDay);

  function moveCursorTo(time: string, day?: Moment) {
    pointerOffsetY.set(toMinutes(time));
  }

  return { todayControls, nextDayControls, moveCursorTo, displayedTasks };
}
