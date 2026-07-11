import type { CachedMetadata } from "obsidian";

import type {
  ListItemEntry,
  LogEntry,
  PlanEntry,
} from "../../redux/index/index-slice";

export interface FileWithMetadata {
  path: string;
  text: string;
  metadata: CachedMetadata;
}

export interface FileIndexContribution {
  taskEntries?: ListItemEntry[];
  logEntries?: LogEntry[];
  planEntries?: PlanEntry[];
}

export interface IndexService {
  index(props: FileWithMetadata): FileIndexContribution;
}
