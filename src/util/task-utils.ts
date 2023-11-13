import { difference, differenceBy } from "lodash/fp";
import type { Moment } from "moment";

import { defaultDurationMinutes } from "../constants";
import type { Task, Tasks } from "../types";
import { PlacedTask } from "../types";
import { getDayKey } from "../ui/hooks/use-edit/transform/drag-and-shift-others";

import { getId } from "./id";
import { addMinutes, minutesToMoment, minutesToMomentOfDay } from "./moment";
import { getTasksWithTime } from "./tasks-utils";

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

export function getTasksWithUpdatedDay(tasks: Tasks) {
  const newDayToTask = Object.entries(tasks)
    .flatMap(([dayKey, tasks]) =>
      tasks.withTime.map((task) => ({ dayKey, task })),
    )
    .filter(({ dayKey, task }) => dayKey !== getDayKey(task.startTime));

  return newDayToTask.reduce<Record<string, Task[]>>(
    (result, { dayKey, task }) => {
      if (dayKey in result) {
        result[dayKey].push(task);
      } else {
        result[dayKey] = [task];
      }

      return result;
    },
    {},
  );
}

export function isDiffEmpty(diff: ReturnType<typeof getDiff>) {
  return Object.values(diff)
    .flat()
    .every((tasks) => tasks.length === 0);
}

function getPristine(flatBaseline: PlacedTask[], flatNext: PlacedTask[]) {
  return flatNext.filter((task) =>
    flatBaseline.find((baselineTask) => isEqualTask(task, baselineTask)),
  );
}

function getCreatedTasks(flatBaseline: PlacedTask[], flatNext: PlacedTask[]) {
  const [, created] = differenceBy((task) => task.id, flatBaseline, flatNext);

  return created;
}

function getTasksWithUpdatedTime(
  flatBaseline: PlacedTask[],
  flatNext: PlacedTask[],
) {
  const pristine = getPristine(flatBaseline, flatNext);

  return difference(flatNext, pristine);
}

export function getDiff(baseline: Tasks, next: Tasks) {
  const flatBaseline = getTasksWithTime(baseline);
  const flatNext = getTasksWithTime(next);

  return {
    updatedTime: getTasksWithUpdatedTime(flatBaseline, flatNext),
    updatedDay: getTasksWithUpdatedDay(next),
    created: getCreatedTasks(flatBaseline, flatNext),
  };
}

export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function createTask(day: Moment, startMinutes: number): PlacedTask {
  return {
    id: getId(),
    startMinutes,
    durationMinutes: defaultDurationMinutes,
    firstLineText: "New item",
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    listTokens: "- [ ] ",
    placing: {
      widthPercent: 100,
      xOffsetPercent: 0,
    },
  };
}
