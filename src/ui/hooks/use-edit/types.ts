import type { Moment } from "moment";

import type { DayPlannerSettings } from "../../../settings";
import type { LocalTask, WithTime } from "../../../task-types";

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
  DELETE = "DELETE",
  SCHEDULE_SEARCH_RESULT = "SCHEDULE_SEARCH_RESULT",
}

export interface EditOperation {
  task: WithTime<LocalTask>;
  mode: EditMode;
}

export type TaskTransformer = (
  baseline: WithTime<LocalTask>[],
  editTarget: WithTime<LocalTask>,
  cursorTime: number,
  settings: DayPlannerSettings,
  day?: Moment,
) => WithTime<LocalTask>[];
