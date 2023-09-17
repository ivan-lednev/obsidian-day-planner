import type { PlacedPlanItem } from "../../../../types";
import { toSpliced } from "../../../../util/to-spliced";

export function resize(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  // todo: don't pass the index, do this outside
  const index = baseline.findIndex((task) => task.id === editTarget.id);

  const endMinutes = cursorTime;
  const durationMinutes = cursorTime - editTarget.startMinutes;

  const updated = {
    ...editTarget,
    durationMinutes,
    endMinutes,
  };

  return toSpliced(baseline, index, updated);
}
