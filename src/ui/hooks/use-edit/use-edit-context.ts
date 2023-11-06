import { Moment } from "moment";
import { derived, Readable, writable } from "svelte/store";

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
  settings,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const pointerOffsetY = writable(0);
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  function getEditHandlers(day: Moment) {
    const { withTime, noTime } = getTasksForDay(day);
    const tasks = { withTime, noTime };
    const baselineTasks = writable(tasks);

    const displayedTasks = useDisplayedTasks({
      day,
      editOperation,
      cursorMinutes,
      baselineTasks,
    });

    const { startEdit, ...actions } = useEditActions({
      editOperation,
      baselineTasks,
      displayedTasks,
      fileSyncInProgress,
      onUpdate,
    });

    // todo: define handlers outside
    const handlers = useEditHandlers({
      day,
      obsidianFacade,
      startEdit,
      cursorMinutes,
      editOperation,
    });

    return { ...handlers, ...actions, displayedTasks, pointerOffsetY };
  }

  return {
    getEditHandlers,
  };
}
