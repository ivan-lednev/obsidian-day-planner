import type { Moment } from "moment";
import type { AttendeePartStat } from "node-ical";
import type { Pos } from "obsidian";

import type { HorizontalPlacing } from "./overlap/horizontal-placing";
import type { ListItemEntryWithChildren } from "./redux/index/index-slice";
import type { IcalConfig } from "./settings";

export interface TimeBlockLocation {
  path: string;
  position: Pos;
}

export interface ListItemTokens {
  symbol: string;
  // todo: remove when we remove dataview
  status?: string;
  task?: string;
}

interface BaseTimeBlock {
  /**
   * Time blocks get an ID on parsing. It is unique to a line in a file, not to a
   * block, visible in the UI (because blocks might get split at midnight, etc.).
   */
  id: string;
  startTime: Moment;
  isAllDayEvent?: boolean;
  // TODO: move to TimeBlockView
  truncated?: Side[];
}

/**
 * Where a time block was derived from. Not yet used to narrow the shape of
 * `LocalTimeBlock`/`RemoteTimeBlock` (see time-block-types.ts todo), only to
 * identify the source of a given time block.
 */
export type TimeBlockSource =
  | "dailyNoteDate"
  | "tasksPluginProp"
  | "listItemLog"
  | "frontmatterLog"
  | "ical"
  | "memory";

export interface RemoteTimeBlock extends BaseTimeBlock {
  source: "ical";
  calendar: IcalConfig;
  summary: string;
  rsvpStatus: AttendeePartStat;
  description?: string;
  location?: string;
}

type Side = "top" | "bottom" | "left" | "right";

export interface LocalTimeBlock extends ListItemTokens, BaseTimeBlock {
  source: Exclude<TimeBlockSource, "ical">;
  text: string;
  children?: Array<ListItemEntryWithChildren>;

  location?: TimeBlockLocation;
  durationMinutes: number;
}

/**
 * A time block is a UI projection of an indexed entry
 */
export type TimeBlock = LocalTimeBlock | RemoteTimeBlock;

export function isRemote(timeBlock: TimeBlock): timeBlock is RemoteTimeBlock {
  return Object.hasOwn(timeBlock, "calendar");
}

export function isLocal(timeBlock: TimeBlock): timeBlock is LocalTimeBlock {
  return Object.hasOwn(timeBlock, "text");
}

export type WithDuration<T> = T & {
  durationMinutes: number;
};

export type WithPlacing<T> = T & {
  placing: HorizontalPlacing;
};

export type TimeInterval = WithDuration<Pick<TimeBlock, "id" | "startTime">>;
