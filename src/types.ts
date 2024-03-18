import type { Moment } from "moment";
import { Pos } from "obsidian";
import { Readable } from "svelte/store";

import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { ObsidianFacade } from "./service/obsidian-facade";
import { IcalConfig } from "./settings";
import { ConfirmationModalProps } from "./ui/confirmation-modal";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import { createShowPreview } from "./util/create-show-preview";
import { getDiff, updateText } from "./util/tasks-utils";

export interface TaskLocation {
  path: string;
  line: number;
  position: Pos;
}

export type OnUpdateFn = (
  taskUpdate: ReturnType<typeof updateText> & {
    moved: { dayKey: string; task: PlacedTask }[];
  },
) => Promise<void | void[]>;

export type Diff = ReturnType<typeof getDiff>;

export interface UnscheduledTask {
  /**
   * @deprecated this will be replaced with dataview `symbol` and `status`
   */
  listTokens: string;

  // TODO: the distinction needs to be clearer
  firstLineText: string;
  text: string;

  id: string;
  location?: TaskLocation;
  placing?: ReturnType<typeof getHorizontalPlacing>;
  isGhost?: boolean;
  calendar?: IcalConfig;
  durationMinutes: number;
}

export interface Task extends UnscheduledTask {
  // todo: should be parsedStartTime to highlight that this doesn't change
  startTime: Moment;
  startMinutes: number;
}

export interface TasksForDay {
  withTime: PlacedTask[];
  noTime: UnscheduledTask[];
}

// todo: rename to DayToTasks
export type Tasks = Record<string, TasksForDay>;

// TODO: delete this type
export interface PlacedTask extends Task {}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<Task, "startMinutes" | "durationMinutes" | "id">;

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
  editContext: ReturnType<typeof useEditContext>;
  visibleTasks: Readable<Tasks>;
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
  const currentPluginVersion: string;
  const changelogMd: string;
}

export type WithIcalConfig<T> = T & { calendar: IcalConfig };
