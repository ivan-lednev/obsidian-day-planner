import type { PlacedPlanItem } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";

export function drag(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const startMinutes = cursorTime;

  const updated = {
    ...editTarget,
    startMinutes,
  };

  return toSpliced(baseline, index, updated);
}
