import { Moment } from "moment";
import { Readable, writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { DayPlannerSettings } from "../../../settings";
import { OnUpdateFn, TasksForDay } from "../../../types";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import { EditOperation } from "./types";
import { useCursorMinutes } from "./use-cursor-minutes";
import { useDisplayedTasks } from "./use-displayed-tasks";
import { useDisplayedTasksForDay } from "./use-displayed-tasks-for-day";
import { useEditActions } from "./use-edit-actions";

export interface UseEditContextProps {
  obsidianFacade: ObsidianFacade;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  visibleTasks: Readable<Record<string, TasksForDay>>;
}

export function useEditContext({
  obsidianFacade,
  onUpdate,
  settings,
  visibleTasks,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const cursor = useCursor(editOperation);
  const pointerOffsetY = writable(0);
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  const baselineTasks = writable({}, (set) => {
    return visibleTasks.subscribe(set);
  });

  const displayedTasks = useDisplayedTasks({
    baselineTasks,
    editOperation,
    cursorMinutes,
    settings,
  });

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks,
    displayedTasks,
    onUpdate,
  });

  function getEditHandlers(day: Moment) {
    const handlers = createEditHandlers({
      day,
      obsidianFacade,
      startEdit,
      cursorMinutes,
      editOperation,
      settings,
    });

    return {
      ...handlers,
      cursor,
      cancelEdit,
      pointerOffsetY,
      displayedTasks: useDisplayedTasksForDay(displayedTasks, day),
    };
  }

  // todo: return stuff only once
  return {
    cursor,
    displayedTasks,
    confirmEdit,
    cancelEdit,
    getEditHandlers,
    editOperation,
  };
}
