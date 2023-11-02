import { Moment } from "moment";
import { derived, Readable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { ObsidianFacade } from "../../service/obsidian-facade";
import { DayPlannerSettings } from "../../settings";
import { GetTasksForDay, OnUpdateFn } from "../../types";
import { offsetYToMinutes } from "../../util/task-utils";

import { EditOperation } from "./use-edit/types";
import { useEdit } from "./use-edit/use-edit";
import { useEditHandlers } from "./use-edit-handlers";

export interface CreateEditContextProps {
  getTasksForDay: GetTasksForDay;
  fileSyncInProgress: Readable<boolean>;
  obsidianFacade: ObsidianFacade;
  onUpdate: OnUpdateFn;
  pointerOffsetY: Readable<number>;
  settings: DayPlannerSettings;
}

export function useEditContext({
  getTasksForDay,
  fileSyncInProgress,
  obsidianFacade,
  onUpdate,
  pointerOffsetY,
  settings,
}: CreateEditContextProps) {
  const dayUnderEdit = writable<Moment | undefined>();
  const editOperation = writable<EditOperation | undefined>();

  function getEditHandlers(day: Moment) {
    const { withTime, noTime } = getTasksForDay(day);
    const tasks = { withTime: addHorizontalPlacing(withTime), noTime };

    const cursorMinutes = derived(pointerOffsetY, ($pointerOffsetY) =>
      offsetYToMinutes($pointerOffsetY, settings.zoomLevel, settings.startHour),
    );

    const {
      startEdit,
      cancelEdit,
      confirmEdit,
      editStatus,
      displayedTasks: baseDisplayedTasks,
    } = useEdit({
      editOperation,
      tasks,
      settings,
      pointerOffsetY,
      fileSyncInProgress,
      onUpdate,
    });

    const handlers = useEditHandlers({
      day,
      obsidianFacade,
      startEdit: (operation: EditOperation) => {
        dayUnderEdit.set(day);
        startEdit(operation);
      },
      editStatus,
      cursorMinutes,
    });

    function handleMouseEnter() {
      dayUnderEdit.set(day);
    }

    const displayedTasks = derived(
      [baseDisplayedTasks, editOperation, dayUnderEdit],
      ([$baseDisplayedTasks, $editOperation, $dayUnderEdit]) => {
        if (
          $dayUnderEdit?.isSame(day, "day") &&
          $editOperation &&
          !$baseDisplayedTasks.withTime.includes($editOperation.task)
        ) {
          return {
            ...$baseDisplayedTasks,
            withTime: [...$baseDisplayedTasks.withTime, $editOperation.task],
          };
        }

        if (
          !$dayUnderEdit?.isSame(day, "day") &&
          $editOperation?.task.startTime.isSame(day, "day")
        ) {
          return {
            ...$baseDisplayedTasks,
            withTime: $baseDisplayedTasks.withTime.filter(
              (task) => task.id !== $editOperation.task.id,
            ),
          };
        }

        return $baseDisplayedTasks;
      },
    );

    return {
      ...handlers,
      cancelEdit,
      confirmEdit,
      displayedTasks,
      handleMouseEnter,
    };
  }

  return {
    getEditHandlers,
  };
}
