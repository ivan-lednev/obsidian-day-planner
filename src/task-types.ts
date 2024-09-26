import type { Moment } from "moment";
import type { AttendeePartStat } from "node-ical";
import type { Pos } from "obsidian";

import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { IcalConfig } from "./settings";
import { getDiff } from "./util/tasks-utils";

export interface TaskTypes {
  path: string;
  position: Pos;
}

export type Diff = ReturnType<typeof getDiff>;

export interface TaskTokens {
  symbol: string;
  status?: string;
}

export interface FileLine {
  text: string;
  line: number;
  task: boolean;
}

export type WithPlacing<T> = T & {
  placing: ReturnType<typeof getHorizontalPlacing>;
};

export type BaseTask = {
  id: string;
  startTime: Moment;
};

export type WithTime<T> = T & {
  /**
   * @deprecated Should be derived from startTime
   */
  startMinutes: number;
  durationMinutes: number;
};

export type RemoteTask = BaseTask & {
  calendar: IcalConfig;
  summary: string;
  rsvpStatus: AttendeePartStat;
  description?: string;
};

export interface LocalTask extends TaskTokens, BaseTask {
  /**
   * @deprecated
   */
  text: string;
  lines?: Array<FileLine>;

  // todo: move out to InMemoryTask
  location?: TaskTypes;
  isGhost?: boolean;

  // todo: move to Time
  durationMinutes: number;
}

export type Task = LocalTask | RemoteTask;

export interface TasksForDay<T = Task> {
  withTime: Array<WithTime<T>>;
  noTime: Array<Task>;
}

export type EditableTasksForDay = TasksForDay<LocalTask>;
export type DayToTasks<T = TasksForDay> = Record<string, T>;
export type DayToEditableTasks = DayToTasks<EditableTasksForDay>;
export type TimeBlock = Omit<WithTime<BaseTask>, "startTime">;

export function isRemote<T extends Task>(task: T): task is T & RemoteTask {
  return Object.hasOwn(task, "calendar");
}

export function isLocal(task: Task): task is WithTime<LocalTask> {
  return Object.hasOwn(task, "location");
}
