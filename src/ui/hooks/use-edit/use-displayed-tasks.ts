import { derived, Readable } from "svelte/store";

import { DayToTasks } from "../../../types";

import { transform } from "./transform/transform";
import { EditOperation } from "./types";

export interface UseDisplayedTasksProps {
  editOperation: Readable<EditOperation>;
  cursorMinutes: Readable<number>;
  baselineTasks: Readable<DayToTasks>;
}

export function useDisplayedTasks({
  editOperation,
  baselineTasks,
  cursorMinutes,
}: UseDisplayedTasksProps) {
  return derived(
    [editOperation, cursorMinutes, baselineTasks],
    ([$editOperation, $cursorMinutes, $baselineTasks]) => {
      if (!$editOperation) {
        return $baselineTasks;
      }

      return transform($baselineTasks, $cursorMinutes, $editOperation);
    },
  );
}
