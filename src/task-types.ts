import type { Moment } from "moment";
import type { AttendeePartStat } from "node-ical";
import type { Pos } from "obsidian";

import type { HorizontalPlacing } from "./overlap/horizontal-placing";
import type { ListItemEntryWithChildren } from "./redux/tracker/tracker-slice";
import type { IcalConfig } from "./settings";

export interface TaskLocation {
  path: string;
  position: Pos;
}

export interface ListItemTokens {
  symbol: string;
  // todo: remove when we remove dataview
  status?: string;
  task?: string;
}

export interface FileLine {
  text: string;
  line: number;
  task: boolean;
}

export type WithPlacing<T> = T & {
  placing: HorizontalPlacing;
};

export type BaseTask = {
  /**
   * Tasks get an ID on parsing. It is unique to a line in a file, not to a
   * block, visible in the UI (because blocks might get split at midnight, etc.).
   */
  id: string;
  startTime: Moment;
  isAllDayEvent?: boolean;
  // TODO: move to TimeBlockView
  truncated?: Side[];
};

export type WithTime<T> = T & {
  durationMinutes: number;
};

export interface RemoteTask extends BaseTask {
  calendar: IcalConfig;
  summary: string;
  rsvpStatus: AttendeePartStat;
  description?: string;
  location?: string;
}

type Side = "top" | "bottom" | "left" | "right";

export interface LocalTask extends ListItemTokens, BaseTask {
  text: string;
  lines?: Array<FileLine>;
  children?: Array<ListItemEntryWithChildren>;

  // todo: move out to InMemoryTask
  location?: TaskLocation;

  // todo: move to Time
  durationMinutes: number;
}

export type TaskWithoutComputedDuration = Omit<LocalTask, "durationMinutes"> &
  Partial<Pick<LocalTask, "durationMinutes">>;

export type Task = LocalTask | RemoteTask;

export function isRemote(task: Task): task is RemoteTask {
  return Object.hasOwn(task, "calendar");
}

export function isLocal(task: Task): task is LocalTask {
  return Object.hasOwn(task, "text");
}
