import type { Task } from "../../../../types";

export function create(
  baseline: Task[],
  editTarget: Task,
  cursorTime: number,
): Task[] {
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
