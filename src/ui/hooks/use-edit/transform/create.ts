import type { PlacedTask } from "../../../../types";

export function create(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  const updated = {
    ...editTarget,
    durationMinutes: cursorTime - editTarget.startMinutes,
  };

  return [...baseline, updated];
}
