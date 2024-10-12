import type { Moment } from "moment";
import { derived, type Readable, type Writable, writable } from "svelte/store";

import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type {
  Task,
  TasksForDay,
  WithPlacing,
  WithTime,
} from "../../../task-types";
import type { OnUpdateFn } from "../../../types";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import type { EditOperation } from "./types";
import { useCursorMinutes } from "./use-cursor-minutes";
import { useEditActions } from "./use-edit-actions";
import { transform } from "./transform/transform";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";
import { getRenderKey } from "../../../util/task-utils";
import { addHorizontalPlacing } from "../../../overlap/overlap";
import { flow, uniqBy } from "lodash/fp";

export interface UseEditContextProps {
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  localTasks: Readable<Task[]>;
  remoteTasks: Readable<Task[]>;
}

export function groupByDay(tasks: Task[]) {
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

  const displayedTasks = derived(
    [editOperation, cursorMinutes, baselineTasks, settings],
    ([$editOperation, $cursorMinutes, $baselineTasks, $settings]) => {
      return $editOperation
        ? transform($baselineTasks, $cursorMinutes, $editOperation, $settings)
        : $baselineTasks;
    },
  );

  const combinedLocalAndRemoteTasks = derived(
    [remoteTasks, displayedTasks],
    ([$remoteTasks, $displayedTasks]) => {
      return $remoteTasks.concat($displayedTasks);
    },
  );

  const grouped = derived(combinedLocalAndRemoteTasks, ($combinedLocalAndRemoteTasks) =>
    groupByDay($combinedLocalAndRemoteTasks),
  );

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks,
    displayedTasks,
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
    displayedTasks,
    confirmEdit,
    cancelEdit,
    getEditHandlers,
    editOperation,
  };
}
