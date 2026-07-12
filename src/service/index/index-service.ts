import type { CachedMetadata } from "obsidian";

import type {
  FileSystemEntry,
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
  fileEntries?: FileSystemEntry[];
  logEntries?: LogEntry[];
  planEntries?: PlanEntry[];
}

export interface IndexService {
  index(props: FileWithMetadata): FileIndexContribution;
}
