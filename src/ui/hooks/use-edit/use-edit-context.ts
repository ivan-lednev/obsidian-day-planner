import { Moment } from "moment";
import { Readable, writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { DayPlannerSettings } from "../../../settings";
import { OnUpdateFn, TasksForDay } from "../../../types";

import { EditOperation } from "./types";
import { useCursorMinutes } from "./use-cursor-minutes";
import { useDisplayedTasks } from "./use-displayed-tasks";
import { useDisplayedTasksForDay } from "./use-displayed-tasks-for-day";
import { useEditActions } from "./use-edit-actions";
import { useEditHandlers } from "./use-edit-handlers";

export interface UseEditContextProps {
  fileSyncInProgress: Readable<boolean>;
  obsidianFacade: ObsidianFacade;
  onUpdate: OnUpdateFn;
  settings: DayPlannerSettings;
  visibleTasks: Record<string, TasksForDay>;
}

export type EditContext = ReturnType<typeof useEditContext>;

export function useEditContext({
  obsidianFacade,
  onUpdate,
  settings,
  visibleTasks,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const pointerOffsetY = writable(0);
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  const baselineTasks = writable(visibleTasks);
  const displayedTasks = useDisplayedTasks({
    baselineTasks,
    editOperation,
    cursorMinutes,
  });

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks,
    displayedTasks,
    onUpdate,
  });

  function getEditHandlers(day: Moment) {
    const handlers = useEditHandlers({
      day,
      obsidianFacade,
      startEdit,
      cursorMinutes,
      editOperation,
    });

    function handleMouseEnter() {
      editOperation.update(
        (previous) =>
          previous && {
            ...previous,
            day,
          },
      );
    }

    return {
      ...handlers,
      handleMouseEnter,
      cancelEdit,
      pointerOffsetY,
      displayedTasks: useDisplayedTasksForDay(displayedTasks, day),
    };
  }

  return {
    displayedTasks,
    confirmEdit,
    getEditHandlers,
    editOperation,
  };
}
