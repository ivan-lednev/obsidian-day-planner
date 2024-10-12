import { derived, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type { DayToTasks, Task } from "../../../task-types";

import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { getDayKey } from "../../../util/tasks-utils";

export interface UseDisplayedTasksProps {
  editOperation: Readable<EditOperation | undefined>;
  cursorMinutes: Readable<number>;
  baselineTasks: Readable<DayToTasks>;
  settings: Readable<DayPlannerSettings>;
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

export function useDisplayedTasks({
  editOperation,
  baselineTasks,
  cursorMinutes,
  settings,
}: UseDisplayedTasksProps) {
  return derived(
    [editOperation, cursorMinutes, baselineTasks, settings],
    ([$editOperation, $cursorMinutes, $baselineTasks, $settings]) => {
      if (!$editOperation) {
        return groupByDay($baselineTasks);
      }

      const transformed = transform(
        $baselineTasks,
        $cursorMinutes,
        $editOperation,
        $settings,
      );

      return groupByDay(transformed);
    },
  );
}
