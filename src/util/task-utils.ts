import { difference } from "lodash/fp";
import type { Moment } from "moment";

import type { Task } from "../types";
import { PlacedTask } from "../types";

import { getId } from "./id";
import { addMinutes, minutesToMoment } from "./moment";

export function isEqualTask(a: Task, b: Task) {
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

export function getRenderKey(task: PlacedTask) {
  return `${task.startMinutes} ${getEndMinutes(task)} ${task.text} ${
    task.isGhost ?? ""
  }`;
}

export function copy(task: Task): Task {
  return {
    ...task,
    id: getId(),
    isGhost: true,
    // todo: there should be a better way to track which tasks are new
    location: { ...task.location, line: undefined },
  };
}

export function createTimestamp(
  startMinutes: number,
  durationMinutes: number,
  format: string,
) {
  const start = minutesToMoment(startMinutes);
  const end = addMinutes(start, durationMinutes);

  return `${start.format(format)} - ${end.format(format)}`;
}

export function findUpdated(baseline: Task[], updated: Task[]) {
  const pristine = updated.filter((task) =>
    baseline.find((baselineTask) => isEqualTask(task, baselineTask)),
  );

  return difference(updated, pristine);
}

export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}
