import { derived, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type { DayToTasks } from "../../../task-types";

import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { partition } from "lodash/fp";
import { getDayKey } from "../../../util/tasks-utils";

export interface UseDisplayedTasksProps {
  editOperation: Readable<EditOperation | undefined>;
  cursorMinutes: Readable<number>;
  baselineTasks: Readable<DayToTasks>;
  settings: Readable<DayPlannerSettings>;
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
        return $baselineTasks;
      }

      const transformed = transform(
        $baselineTasks,
        $cursorMinutes,
        $editOperation,
        $settings,
      );

      const grouped = transformed.reduce((result, task) => {
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

      return grouped;
    },
  );
}
