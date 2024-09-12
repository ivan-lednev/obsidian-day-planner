import type { Moment } from "moment";
import { type Readable, writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import type { DayPlannerSettings } from "../../../settings";
import type { TasksForDay } from "../../../task-types";
import type { OnUpdateFn } from "../../../types";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import type { EditOperation } from "./types";
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
      displayedTasks: useDisplayedTasksForDay(displayedTasks, day),
    };
  }

  return {
    cursor,
    pointerOffsetY,
    displayedTasks,
    confirmEdit,
    cancelEdit,
    getEditHandlers,
    editOperation,
  };
}
