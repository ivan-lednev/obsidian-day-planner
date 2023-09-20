import type { PlanItem } from "../types";

export function isEqualTask(a: PlanItem, b: PlanItem) {
  return (
    a.id === b.id &&
    a.startMinutes === b.startMinutes &&
    a.durationMinutes === b.durationMinutes
  );
}

export function createTask(original?: PlanItem) {
  return {
    ...(original || {}),
    get endMinutes() {
      return this.startMinutes + this.durationMinutes;
    },
  };
}

export function getEndMinutes(task: {
  startMinutes: number;
  durationMinutes: number;
}) {
  return task.startMinutes + task.durationMinutes;
}
