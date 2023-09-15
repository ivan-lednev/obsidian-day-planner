import type { PlacedPlanItem } from "../../../../types";
import { EditOperation, EditMode } from "../types";

import { drag } from "./drag";
import { dragAndShiftOthers } from "./drag-and-shift-others";

export function transform(
  baseline: PlacedPlanItem[],
  cursorTime: number,
  { taskId, mode }: EditOperation,
) {
  const editTarget = baseline.find((task) => task.id === taskId);

  switch (mode) {
    case EditMode.DRAG:
      return drag(baseline, editTarget, cursorTime);
    case EditMode.DRAG_AND_SHIFT_OTHERS:
      return dragAndShiftOthers(baseline, editTarget, cursorTime);
    default:
      throw new Error(`Unknown edit mode: ${mode}`);
  }
}
