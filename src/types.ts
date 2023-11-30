import type { Moment } from "moment";
import { MetadataCache, Pos } from "obsidian";
import { Readable, Writable } from "svelte/store";

import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { ObsidianFacade } from "./service/obsidian-facade";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import { getDiff, updateText } from "./util/tasks-utils";

export interface TaskLocation {
  path: string;
  line: number;
  position: Pos;
}

export type OnUpdateFn = (
  taskUpdate: ReturnType<typeof updateText>,
) => Promise<void | void[]>;

export type Diff = ReturnType<typeof getDiff>;

export interface UnscheduledTask {
  /**
   * @deprecated this will be replaced with dataview `symbol` and `status`
   */
  listTokens: string;

  // todo: the distinction needs to be clearer
  firstLineText: string;
  text: string;

  id: string;
  location?: TaskLocation;
  placing?: ReturnType<typeof getHorizontalPlacing>;
  isGhost?: boolean;
  durationMinutes: number;
}

export interface Task extends UnscheduledTask {
  startTime: Moment;
  startMinutes: number;
}

export interface TasksForDay {
  withTime: PlacedTask[];
  noTime: UnscheduledTask[];
}

export type Tasks = Record<string, TasksForDay>;

// todo: we don't need this, since it's all optional
export interface PlacedTask extends Task {}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<Task, "startMinutes" | "durationMinutes" | "id">;

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}

export type Timestamp = {
  startMinutes: number;
  durationMinutes: number;
};

export type CleanUp = () => void;
export type RenderMarkdown = (el: HTMLElement, markdown: string) => CleanUp;
export type GetTasksForDay = (day: Moment) => TasksForDay;

export interface ObsidianContext {
  obsidianFacade: ObsidianFacade;
  metadataCache: MetadataCache;
  onUpdate: OnUpdateFn;
  initWeeklyView: () => Promise<void>;
  getTasksForDay: Readable<GetTasksForDay>;
  refreshTasks: (source: string) => void;
  dataviewLoaded: Writable<boolean>;
  fileSyncInProgress: Readable<boolean>;
  renderMarkdown: RenderMarkdown;
  editContext: Readable<ReturnType<typeof useEditContext>>;
  visibleTasks: Readable<Tasks>;
}
