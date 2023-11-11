import type { PlacedTask } from "../../../../types";

export function create(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  return baseline.map((task) => {
    if (task.id === editTarget.id) {
      return {
        ...editTarget,
        durationMinutes: cursorTime - editTarget.startMinutes,
      };
    }

    return task;
  });
}
