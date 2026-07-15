import type { Moment } from "moment";
import type { AttendeePartStat } from "node-ical";
import type { Pos } from "obsidian";

import type { HorizontalPlacing } from "./overlap/horizontal-placing";
import type { ListItemEntryWithChildren } from "./redux/index/index-slice";
import type { IcalConfig } from "./settings";

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

export interface RemoteTimeBlock extends BaseTimeBlock {
  source: "ical";
  calendar: IcalConfig;
  summary: string;
  rsvpStatus: AttendeePartStat;
  description?: string;
  location?: string;
}

type Side = "top" | "bottom" | "left" | "right";

interface LocalTimeBlockBase extends ListItemTokens, BaseTimeBlock {
  text: string;
  children?: Array<ListItemEntryWithChildren>;
  durationMinutes: number;
}

/**
 * A time block parsed from a list item in a file. Its position in the file is
 * always known.
 */
interface ListItemSourcedTimeBlockBase extends LocalTimeBlockBase {
  path: string;
  position: Pos;
}

export interface DailyNoteDateTimeBlock extends ListItemSourcedTimeBlockBase {
  source: "dailyNoteDate";
}

export interface TasksPluginPropTimeBlock extends ListItemSourcedTimeBlockBase {
  source: "tasksPluginProp";
}

export interface ListItemLogTimeBlock extends ListItemSourcedTimeBlockBase {
  source: "listItemLog";
}

export interface FrontmatterLogTimeBlock extends LocalTimeBlockBase {
  source: "frontmatterLog";
  /**
   * Frontmatter logs are attached to a whole file, not to a line, so they
   * have a path, but no position.
   */
  path: string;
}

/**
 * Where an unwritten time block should be materialized in the vault on
 * confirmation.
 */
export type WriteDestination =
  | { type: "line"; path: string; line: number }
  | {
      /**
       * The planner heading of the daily note derived from the block's start
       * time. Resolved at write time, so dragging the block to another day
       * retargets the note.
       */
      type: "plannerHeading";
    };

/**
 * A time block that only exists in memory: it was just created or copied and
 * has not been written to a file yet, so it has no position. Instead, it
 * carries a destination that says where it should be written.
 */
export interface UnwrittenTimeBlock extends LocalTimeBlockBase {
  source: "unwritten";
  destination: WriteDestination;
}

export type PlanTimeBlock = DailyNoteDateTimeBlock | TasksPluginPropTimeBlock;

export type LogTimeBlock = ListItemLogTimeBlock | FrontmatterLogTimeBlock;

export type ListItemSourcedTimeBlock = PlanTimeBlock | ListItemLogTimeBlock;

export type IndexedTimeBlock = PlanTimeBlock | LogTimeBlock;

export type EditableTimeBlock = PlanTimeBlock | UnwrittenTimeBlock;

export type LocalTimeBlock = IndexedTimeBlock | UnwrittenTimeBlock;

export type TimeBlock = LocalTimeBlock | RemoteTimeBlock;

export type TimelineTimeBlock = RemoteTimeBlock | EditableTimeBlock;

// todo: remove
export function isRemote(timeBlock: TimeBlock): timeBlock is RemoteTimeBlock {
  return Object.hasOwn(timeBlock, "calendar");
}

export function isLocal(timeBlock: TimeBlock): timeBlock is LocalTimeBlock {
  return Object.hasOwn(timeBlock, "text");
}

export function isListItemSourced(
  timeBlock: LocalTimeBlock,
): timeBlock is ListItemSourcedTimeBlock {
  return (
    timeBlock.source !== "unwritten" && timeBlock.source !== "frontmatterLog"
  );
}

export type WithDuration<T> = T & {
  durationMinutes: number;
};

export type WithPlacing<T> = T & {
  placing: HorizontalPlacing;
};

export type TimeInterval = WithDuration<Pick<TimeBlock, "id" | "startTime">>;
