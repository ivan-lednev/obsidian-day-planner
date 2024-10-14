import { flow, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, type Readable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type {
  LocalTask,
  Task,
  WithPlacing,
  WithTime,
} from "../../../task-types";
import type { OnUpdateFn } from "../../../types";
import { getDiffInMinutes, splitMultiday } from "../../../util/moment";
import { getEndTime, getRenderKey, isWithTime } from "../../../util/task-utils";
import { getDayKey, getEmptyRecordsForDay } from "../../../util/tasks-utils";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { useCursorMinutes } from "./use-cursor-minutes";
import { useEditActions } from "./use-edit-actions";

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

export function useEditContext(props: {
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  localTasks: Readable<LocalTask[]>;
  remoteTasks: Readable<Task[]>;
}) {
  const { workspaceFacade, onUpdate, settings, localTasks, remoteTasks } =
    props;

  const editOperation = writable<EditOperation | undefined>();
  const cursor = useCursor(editOperation);
  const pointerOffsetY = writable(0);
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  const baselineTasks = writable<LocalTask[]>([], (set) => {
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

  const dayToDisplayedTasks = derived(
    [remoteTasks, tasksWithPendingUpdate],
    ([$remoteTasks, $tasksWithPendingUpdate]) => {
      const combinedTasks = $remoteTasks.concat($tasksWithPendingUpdate);
      const split = combinedTasks.flatMap((task) => {
        if (!isWithTime(task)) {
          return task;
        }

        const chunks = splitMultiday(task.startTime, getEndTime(task));

        return chunks.map(([startTime, endTime]) => ({
          ...task,
          startTime,
          durationMinutes: getDiffInMinutes(startTime, endTime),
        }));
      });

      return groupByDay(split);
    },
  );

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks,
    tasksWithPendingUpdate,
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

    const displayedTasksForDay = derived(
      dayToDisplayedTasks,
      ($dayToDisplayedTasks) => {
        const tasksForDay =
          $dayToDisplayedTasks[getDayKey(day)] || getEmptyRecordsForDay();

        const withTime: Array<WithPlacing<WithTime<Task>>> = flow(
          uniqBy(getRenderKey),
          addHorizontalPlacing,
        )(tasksForDay.withTime);

        return {
          ...tasksForDay,
          withTime,
        };
      },
    );

    return {
      ...handlers,
      displayedTasksForDay,
    };
  }

  return {
    cursor,
    pointerOffsetY,
    dayToDisplayedTasks,
    confirmEdit,
    cancelEdit,
    getEditHandlers,
    editOperation,
  };
}
