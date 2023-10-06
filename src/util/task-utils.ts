import type { Moment } from "moment";

import { scheduledDateRegExp } from "../regexp";
import type { PlanItem } from "../types";
import { PlacedPlanItem } from "../types";

export function isEqualTask(a: PlanItem, b: PlanItem) {
  return (
    a.id === b.id &&
    a.startMinutes === b.startMinutes &&
    a.durationMinutes === b.durationMinutes
  );
}

export function getEndMinutes(task: {
  startMinutes: number;
  durationMinutes: number;
}) {
  return task.startMinutes + task.durationMinutes;
}

export function getEndTime(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return task.startTime.clone().add(task.durationMinutes, "minutes");
}

export function getRenderKey(task: PlacedPlanItem) {
  return `${task.startMinutes} ${getEndMinutes(task)} ${task.text} ${
    task.isGhost ?? ""
  }`;
}

export function getDisplayedText(task: PlanItem) {
  return task.text.replace(scheduledDateRegExp, "");
}
