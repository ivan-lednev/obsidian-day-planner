import { Moment } from "moment";
import { derived, Readable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { ObsidianFacade } from "../../../service/obsidian-facade";
import { DayPlannerSettings } from "../../../settings";
import { GetTasksForDay, OnUpdateFn } from "../../../types";
import { offsetYToMinutes } from "../../../util/task-utils";

import { EditOperation } from "./types";
import { useDisplayedTasks } from "./use-displayed-tasks";
import { useEditActions } from "./use-edit-actions";
import { useEditHandlers } from "./use-edit-handlers";

export interface UseEditContextProps {
  getTasksForDay: GetTasksForDay;
  fileSyncInProgress: Readable<boolean>;
  obsidianFacade: ObsidianFacade;
  onUpdate: OnUpdateFn;
  pointerOffsetY: Readable<number>;
  settings: DayPlannerSettings;
}

function useCursorMinutes(
  pointerOffsetY: Readable<number>,
  settings: DayPlannerSettings,
) {
  return derived(pointerOffsetY, ($pointerOffsetY) =>
    offsetYToMinutes($pointerOffsetY, settings.zoomLevel, settings.startHour),
  );
}

export function useEditContext({
  getTasksForDay,
  fileSyncInProgress,
  obsidianFacade,
  onUpdate,
  pointerOffsetY,
  settings,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  function getEditHandlers(day: Moment) {
    const { withTime, noTime } = getTasksForDay(day);
    const tasks = { withTime: addHorizontalPlacing(withTime), noTime };
    const baselineTasks = writable(tasks);

    const displayedTasks = useDisplayedTasks({
      day,
      editOperation,
      cursorMinutes,
      baselineTasks,
    });

    const { startEdit, confirmEdit, cancelEdit } = useEditActions({
      day,
      editOperation,
      baselineTasks,
      displayedTasks,
      fileSyncInProgress,
      onUpdate,
    });

    const handlers = useEditHandlers({
      day,
      obsidianFacade,
      startEdit,
      cursorMinutes,
      editOperation,
    });

    return {
      ...handlers,
      displayedTasks,
      cancelEdit,
      confirmEdit,
    };
  }

  return {
    getEditHandlers,
  };
}
