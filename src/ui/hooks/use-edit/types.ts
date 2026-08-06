import type { TimeInterval } from "../../../time-block-types";

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

export type EditableInterval = TimeInterval & {
  isAllDayEvent?: boolean;
};

/**
 * Planner and tracker blocks keep separate baselines and separate write paths.
 * An operation lives in the store of the lane it belongs to, so the kind of
 * block it edits is known statically and never has to be tested for.
 */
export interface EditOperation<Block extends EditableInterval> {
  timeBlock: Block;
  mode: EditMode;
}
