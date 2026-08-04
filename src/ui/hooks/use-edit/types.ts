import type {
  EditableTimeBlock,
  LogTimeBlock,
  TimeInterval,
  WithDuration,
} from "../../../time-block-types";

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
 * Which one an operation belongs to is told apart by its block, through the
 * `isLog` guard.
 */
export interface EditOperation {
  timeBlock: WithDuration<EditableTimeBlock> | WithDuration<LogTimeBlock>;
  mode: EditMode;
}
