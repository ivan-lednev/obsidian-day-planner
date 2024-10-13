import { flow, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, type Readable, type Writable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type { Task, WithPlacing, WithTime } from "../../../task-types";
import type { OnUpdateFn } from "../../../types";
import { getRenderKey } from "../../../util/task-utils";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { useCursorMinutes } from "./use-cursor-minutes";
import { useEditActions } from "./use-edit-actions";

export interface UseEditContextProps {
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  localTasks: Readable<Task[]>;
  remoteTasks: Readable<Task[]>;
}

function groupByDay(tasks: Task[]) {
  return tasks.reduce((result, task) => {
    const key = getDayKey(task.startTime);

    if (!result[key]) {
      result[key] = { withTime: [], noTime: [] };
    }

    if (task.isAllDayEvent) {
      result[key].noTime.push(task);
    } else {
      result[key].withTime.push(task);
    }

    return result;
  }, {});
}

export function useEditContext({
  workspaceFacade,
  onUpdate,
  settings,
  localTasks,
  remoteTasks,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const cursor = useCursor(editOperation);
  const pointerOffsetY = writable(0);
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  const baselineTasks: Writable<Task[]> = writable([], (set) => {
    return localTasks.subscribe(set);
  });

  const tasksWithPendingUpdate = derived(
    [editOperation, cursorMinutes, baselineTasks, settings],
    ([$editOperation, $cursorMinutes, $baselineTasks, $settings]) => {
      return $editOperation
        ? transform($baselineTasks, $cursorMinutes, $editOperation, $settings)
        : $baselineTasks;
    },
  );

  const grouped = derived(
    [remoteTasks, tasksWithPendingUpdate],
    ([$remoteTasks, $displayedTasks]) => {
      const combinedTasks = $remoteTasks.concat($displayedTasks);

      return groupByDay(combinedTasks);
    },
  );

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks,
    // todo: consistent naming
    displayedTasks: tasksWithPendingUpdate,
    onUpdate,
  });

  function getEditHandlers(day: Moment) {
    const handlers = createEditHandlers({
      day,
      workspaceFacade,
      startEdit,
      cursorMinutes,
      editOperation,
      settings,
    });

    const displayedTasksForDay = derived(grouped, ($grouped) => {
      const tasksForDay = $grouped[getDayKey(day)] || getEmptyRecordsForDay();

      const withTime: Array<WithPlacing<WithTime<Task>>> = flow(
        uniqBy(getRenderKey),
        addHorizontalPlacing,
      )(tasksForDay.withTime);

      return {
        ...tasksForDay,
        withTime,
      };
    });

    return {
      ...handlers,
      displayedTasks: displayedTasksForDay,
    };
  }

  return {
    cursor,
    pointerOffsetY,
    displayedTasks: grouped,
    confirmEdit,
    cancelEdit,
    getEditHandlers,
    editOperation,
  };
}
