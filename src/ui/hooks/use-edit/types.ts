import type { DayPlannerSettings } from "../../../settings";
import type { LocalTask, WithTime } from "../../../task-types";
import type { PointerDateTime } from "../../../types";

export enum EditMode {
  DRAG = "DRAG",
  DRAG_AND_SHIFT_OTHERS = "DRAG_AND_SHIFT_OTHERS",
  DRAG_AND_SHRINK_OTHERS = "DRAG_AND_SHRINK_OTHERS",
  RESIZE = "RESIZE",
  RESIZE_FROM_TOP = "RESIZE_FROM_TOP",
  RESIZE_AND_SHIFT_OTHERS = "RESIZE_AND_SHIFT_OTHERS",
  RESIZE_FROM_TOP_AND_SHIFT_OTHERS = "RESIZE_FROM_TOP_AND_SHIFT_OTHERS",
  RESIZE_AND_SHRINK_OTHERS = "RESIZE_AND_SHRINK_OTHERS",
  RESIZE_FROM_TOP_AND_SHRINK_OTHERS = "RESIZE_FROM_TOP_AND_SHRINK_OTHERS",
  CREATE = "CREATE",
  SCHEDULE_SEARCH_RESULT = "SCHEDULE_SEARCH_RESULT",
}

export interface EditOperation {
  task: WithTime<LocalTask>;
  mode: EditMode;
}

export type TaskTransformer = (
  baseline: WithTime<LocalTask>[],
  // TODO: pass only id
  editTarget: WithTime<LocalTask>,
  // TODO: remove
  cursorTime: number,
  settings: DayPlannerSettings,
  pointerDateTime: PointerDateTime,
) => WithTime<LocalTask>[];
