import { derived, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type { DayToTasks } from "../../../task-types";

import { transform } from "./transform/transform";
import type { EditOperation } from "./types";

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

      return transform(
        $baselineTasks,
        $cursorMinutes,
        $editOperation,
        $settings,
      );
    },
  );
}
