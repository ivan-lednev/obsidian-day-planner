import type { ListItemCache, Pos } from "obsidian";

import type {
  ListItemEntry,
  LogEntry,
  PlanEntry,
} from "../../redux/index/index-slice";

import type { FileWithMetadata } from "./index-service";

export type RawListItemEntry = Pick<
  ListItemEntry,
  "id" | "text" | "symbol" | "task" | "position" | "path"
>;

export interface RawListItemEntryWithContext {
  listItemCache: ListItemCache;
  rawListItemEntry: RawListItemEntry;
  listItemText: string;
}

export interface ListItemIndexResult {
  planEntries?: PlanEntry[];
  logEntries?: LogEntry[];
  propsPosition?: Pos;
}

export type ListItemIndexer = (
  props: RawListItemEntryWithContext,
) => ListItemIndexResult;

export interface ListItemIndexExtensionService {
  forFile(props: FileWithMetadata): ListItemIndexer;
}
