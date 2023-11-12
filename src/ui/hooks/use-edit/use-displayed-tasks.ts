import { derived, Readable } from "svelte/store";

import { Tasks } from "../../../types";

import { transform } from "./transform/transform";
import { EditOperation } from "./types";

export interface UseDisplayedTasksProps {
  editOperation: Readable<EditOperation>;
  cursorMinutes: Readable<number>;
  baselineTasks: Readable<Tasks>;
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
