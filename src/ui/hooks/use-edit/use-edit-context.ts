import { flow, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, type Readable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import type { PeriodicNotes } from "../../../service/periodic-notes";
import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type {
  LocalTask,
  Task,
  WithPlacing,
  WithTime,
} from "../../../task-types";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";
import * as m from "../../../util/moment";
import * as t from "../../../util/task-utils";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { useEditActions } from "./use-edit-actions";

function groupByDay(tasks: Task[]) {
  return tasks.reduce<Record<string, { withTime: Task[]; noTime: Task[] }>>(
    (result, task) => {
      const key = t.getDayKey(task.startTime);

      if (!result[key]) {
        result[key] = { withTime: [], noTime: [] };
      }

      if (task.isAllDayEvent) {
        result[key].noTime.push(task);
      } else {
        result[key].withTime.push(task);
      }

      return result;
    },
    {},
  );
}

export function useEditContext(props: {
  workspaceFacade: WorkspaceFacade;
  periodicNotes: PeriodicNotes;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  localTasks: Readable<LocalTask[]>;
  remoteTasks: Readable<Task[]>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    workspaceFacade,
    periodicNotes,
    onEditAborted,
    onUpdate,
    settings,
    localTasks,
    remoteTasks,
    pointerDateTime,
    abortEditTrigger,
  } = props;

  const editOperation = writable<EditOperation | undefined>(
    undefined,
    (set, updateEditOperation) => {
      const unsubscribe = abortEditTrigger.subscribe(() => {
        updateEditOperation((currentEditOperation) => {
          if (currentEditOperation !== undefined) {
            onEditAborted();
          }

          return undefined;
        });
      });

      return unsubscribe;
    },
  );
  const cursor = useCursor(editOperation);

  const baselineTasks = writable<LocalTask[]>([], (set) => {
    return localTasks.subscribe(set);
  });

  const tasksWithPendingUpdate = derived(
    [editOperation, baselineTasks, settings, pointerDateTime],
    ([$editOperation, $baselineTasks, $settings, $pointerDateTime]) => {
      return $editOperation
        ? transform($baselineTasks, $editOperation, $settings, $pointerDateTime)
        : $baselineTasks;
    },
  );

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks,
    tasksWithPendingUpdate,
    onUpdate,
  });

  const handlers = createEditHandlers({
    periodicNotes,
    pointerDateTime,
    workspaceFacade,
    startEdit,
    editOperation,
    settings,
  });

  const combinedTasks = derived(
    [remoteTasks, tasksWithPendingUpdate],
    ([$remoteTasks, $tasksWithPendingUpdate]) =>
      $remoteTasks.concat($tasksWithPendingUpdate),
  );

  const dayToDisplayedTasks = derived(combinedTasks, ($combinedTasks) => {
    const split: Task[] = $combinedTasks.flatMap((task): Task[] | Task => {
      if (!t.isWithTime(task) || task.isAllDayEvent) {
        return task;
      }

      const daySpan = t.getEndTime(task).diff(task.startTime, "days");

      // If a task spans more than 24 hours, it goes to the multi-day row
      if (daySpan > 1) {
        return task;
      }

      const chunks = m.splitMultiday(task.startTime, t.getEndTime(task));

      return chunks.map(([startTime, endTime]) => ({
        ...task,
        startTime,
        durationMinutes: m.getDiffInMinutes(startTime, endTime),
      }));
    });

    return groupByDay(split);
  });

  const getDisplayedAllDayTasksForMultiDayRow = derived(
    [combinedTasks],
    ([$combinedTasks]) =>
      (range: m.Range) => {
        const startOfRange = range.start.clone().startOf("day");
        const endOfRange = range.end.clone().add(1, "day").startOf("day");

        return $combinedTasks
          .filter((task) => {
            // TODO: a limitation to be removed later
            if (!task.isAllDayEvent) {
              return false;
            }

            if ("durationMinutes" in task) {
              return m.doesOverlapWithRange(
                {
                  start: task.startTime,
                  end: t.getEndTime(task),
                },
                { start: startOfRange, end: endOfRange },
              );
            }

            return m.isWithinRange(task.startTime, range);
          })
          .map(
            (task): Task =>
              t.isWithTime(task) ? t.truncateToRange(task, range) : task,
          );
      },
  );

  function getDisplayedTasksForTimeline(day: Moment) {
    return derived(dayToDisplayedTasks, ($dayToDisplayedTasks) => {
      const tasksForDay =
        $dayToDisplayedTasks[t.getDayKey(day)] || t.getEmptyTasksForDay();

      const withTime: Array<WithPlacing<WithTime<Task>>> = flow(
        uniqBy(t.getRenderKey),
        addHorizontalPlacing,
      )(tasksForDay.withTime);

      return {
        ...tasksForDay,
        withTime,
      };
    });
  }

  return {
    handlers,
    cursor,
    dayToDisplayedTasks,
    confirmEdit,
    cancelEdit,
    editOperation,
    getDisplayedTasksForTimeline,
    getDisplayedAllDayTasksForMultiDayRow,
  };
}
