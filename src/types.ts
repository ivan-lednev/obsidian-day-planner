import type { Moment } from "moment";
import type { Pos } from "obsidian";
import type { Readable, Writable } from "svelte/store";

import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { ObsidianFacade } from "./service/obsidian-facade";
import type { IcalConfig } from "./settings";
import type { ConfirmationModalProps } from "./ui/confirmation-modal";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import { createShowPreview } from "./util/create-show-preview";
import { getDiff, updateText } from "./util/tasks-utils";

export interface TaskLocation {
  path: string;
  position: Pos;
}

export type OnUpdateFn = (
  taskUpdate: ReturnType<typeof updateText> & {
    moved: { dayKey: string; task: WithTime<LocalTask> }[];
  },
) => Promise<void | void[]>;

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

export type RenderId = {
  id: string;
};

export type WithTime<T> = T & {
  startTime: Moment;
  /**
   * @deprecated Should be derived from startTime
   */
  startMinutes: number;
  durationMinutes: number;
};

export type RemoteTask = RenderId & {
  calendar: IcalConfig;
  summary: string;
  description?: string;
};

export interface LocalTask extends TaskTokens {
  /**
   * @deprecated
   */
  text: string;
  lines?: Array<FileLine>;

  id: string;

  // todo: move out to InMemoryTask
  location?: TaskLocation;
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

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Omit<WithTime<RenderId>, "startTime">;

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}

export type CleanUp = () => void;
export type RenderMarkdown = (el: HTMLElement, markdown: string) => CleanUp;

export interface ObsidianContext {
  obsidianFacade: ObsidianFacade;
  initWeeklyView: () => Promise<void>;
  refreshTasks: (source: string) => void;
  dataviewLoaded: Readable<boolean>;
  renderMarkdown: RenderMarkdown;
  toggleCheckboxInFile: ObsidianFacade["toggleCheckboxInFile"];
  editContext: ReturnType<typeof useEditContext>;
  visibleTasks: Readable<DayToTasks>;
  showReleaseNotes: () => void;
  showPreview: ReturnType<typeof createShowPreview>;
  isModPressed: Readable<boolean>;
  reSync: () => void;
  isOnline: Readable<boolean>;
  isDarkMode: Readable<boolean>;
  showConfirmationModal: (props: ConfirmationModalProps) => void;
}

export type ComponentContext = Map<string, unknown>;

declare global {
  /**
   * Placeholders expanded at build-time
   */
  const currentPluginVersion: string;
  const changelogMd: string;
  const supportBanner: string;
}

export type WithIcalConfig<T> = T & { calendar: IcalConfig };

export function isRemote<T extends Task>(task: T): task is T & RemoteTask {
  return Object.hasOwn(task, "calendar");
}

export function isLocal(task: Task): task is WithTime<LocalTask> {
  return Object.hasOwn(task, "location");
}

export type DateRange = Writable<Moment[]> & { untrack: () => void };
