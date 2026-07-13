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

export type WithPlacing<T> = T & {
  placing: HorizontalPlacing;
};

/**
 * A time block is a UI projection of an indexed entry
 */
export type BaseTimeBlock = {
  /**
   * Time blocks get an ID on parsing. It is unique to a line in a file, not to a
   * block, visible in the UI (because blocks might get split at midnight, etc.).
   */
  id: string;
  startTime: Moment;
  isAllDayEvent?: boolean;
  // TODO: move to TimeBlockView
  truncated?: Side[];
};

export type WithDuration<T> = T & {
  durationMinutes: number;
};

export interface RemoteTimeBlock extends BaseTimeBlock {
  calendar: IcalConfig;
  summary: string;
  rsvpStatus: AttendeePartStat;
  description?: string;
  location?: string;
}

type Side = "top" | "bottom" | "left" | "right";

export interface LocalTimeBlock extends ListItemTokens, BaseTimeBlock {
  text: string;
  children?: Array<ListItemEntryWithChildren>;

  // todo: move out to InMemoryTask
  location?: TimeBlockLocation;

  // todo: move to Time
  durationMinutes: number;
}

export type TimeBlock = LocalTimeBlock | RemoteTimeBlock;

export function isRemote(timeBlock: TimeBlock): timeBlock is RemoteTimeBlock {
  return Object.hasOwn(timeBlock, "calendar");
}

export function isLocal(timeBlock: TimeBlock): timeBlock is LocalTimeBlock {
  return Object.hasOwn(timeBlock, "text");
}
