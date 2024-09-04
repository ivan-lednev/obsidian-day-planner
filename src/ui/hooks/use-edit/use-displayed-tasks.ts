import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../../../settings";
import { DayToTasks } from "../../../types";

import { transform } from "./transform/transform";
import { EditOperation } from "./types";

export interface UseDisplayedTasksProps {
  editOperation: Readable<EditOperation>;
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
