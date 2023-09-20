import type { PlacedPlanItem } from "../../../../types";
import { EditMode, EditOperation } from "../types";

import { create } from "./create";
import { drag } from "./drag";
import { dragAndShiftOthers } from "./drag-and-shift-others";
import { resize } from "./resize";
import { resizeAndShiftOthers } from "./resize-and-shift-others";

export function transform(
  baseline: PlacedPlanItem[],
  cursorTime: number,
  { task, mode }: EditOperation,
) {
  switch (mode) {
    case EditMode.DRAG:
      return drag(baseline, task, cursorTime);
    case EditMode.DRAG_AND_SHIFT_OTHERS:
      return dragAndShiftOthers(baseline, task, cursorTime);
    case EditMode.CREATE:
      return create(baseline, task, cursorTime);
    case EditMode.RESIZE:
      return resize(baseline, task, cursorTime);
    case EditMode.RESIZE_AND_SHIFT_OTHERS:
      return resizeAndShiftOthers(baseline, task, cursorTime);
    default:
      throw new Error(`Unknown edit mode: ${mode}`);
  }
}
