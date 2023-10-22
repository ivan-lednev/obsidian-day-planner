import type { Moment } from "moment";

import type { PlanItem } from "../types";
import { PlacedPlanItem } from "../types";

import { getId } from "./id";

export function isEqualTask(a: PlanItem, b: PlanItem) {
  return (
    a.id === b.id &&
    a.startMinutes === b.startMinutes &&
    a.durationMinutes === b.durationMinutes
  );
}

export function isWithTime(task: Partial<Pick<PlanItem, "startTime">>) {
  return Boolean(task.startTime);
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

export function copy(task: PlanItem): PlanItem {
  return {
    ...task,
    id: getId(),
    isGhost: true,
    // todo: there should be a better way to track which tasks are new
    location: { ...task.location, line: undefined },
  };
}
