import { Moment } from "moment";

import { DayPlannerSettings } from "../../../settings";
import type { Task } from "../../../types";

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
}

export interface EditOperation {
  task: Task;
  mode: EditMode;
  day: Moment;
}

export type TaskTransformer = (
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
  settings: DayPlannerSettings,
) => Task[];
