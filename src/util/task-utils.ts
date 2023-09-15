import type { PlanItem } from "../types";

export function isEqualTask(a: PlanItem, b: PlanItem) {
  return (
    a.id === b.id &&
    a.startMinutes === b.startMinutes &&
    a.endMinutes === b.endMinutes && // todo: remove after endMinutes is replaced with a getter
    a.durationMinutes === b.durationMinutes
  );
}
