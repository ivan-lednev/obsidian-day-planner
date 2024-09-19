import type { Duration, Moment } from "moment";
import type { Pos } from "obsidian";

import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { IcalConfig } from "./settings";

export interface TaskLocation {
  path: string;
  position: Pos;
}

// todo: bullet is more accurate
export interface FileLine {
  text: string;
  line: number;
  isTask: boolean;
}

export type WithPlacing<T> = T & {
  placing: ReturnType<typeof getHorizontalPlacing>;
};

export interface BaseTask {
  renderId: string;
  time: Moment;
  duration: Duration;
  isAllDay: boolean;
}

export interface RemoteTask extends BaseTask {
  type: "remote";
  calendar: IcalConfig;
  summary: string;
  description?: string;
}

export interface LocalTask extends BaseTask {
  location: TaskLocation;
  lines: Array<FileLine>;
  symbol: string;
  status?: string;
}

export interface InMemoryTask extends LocalTask {
  type: "in-memory";
}

export interface PlannerTask extends LocalTask {
  type: "planner";
}

export interface TasksPluginTask extends LocalTask {
  type: "tasks-plugin";
}

export type Task = RemoteTask | InMemoryTask | PlannerTask | TasksPluginTask;

export type DayToTasks = Record<string, Task>;
