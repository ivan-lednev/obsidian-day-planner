import type { Moment } from "moment";
import type { Readable, Writable } from "svelte/store";

import { type AppDispatch, type AppStore } from "./redux/store";
import type { createUseSelector } from "./redux/use-selector";
import type { DataviewFacade } from "./service/dataview-facade";
import type { STaskEditor } from "./service/stask-editor";
import type { VaultFacade } from "./service/vault-facade";
import type { WorkspaceFacade } from "./service/workspace-facade";
import type { DayPlannerSettings, IcalConfig } from "./settings";
import type { LocalTask, WithPlacing } from "./task-types";
import { EditMode } from "./ui/hooks/use-edit/types";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import { type ShowPreview } from "./util/create-show-preview";

export type OnUpdateFn = (
  base: Array<LocalTask>,
  next: Array<LocalTask>,
  mode: EditMode,
) => Promise<void>;

export type RelationToNow = "past" | "present" | "future";

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}

export type CleanUp = () => void;
export type RenderMarkdown = (el: HTMLElement, markdown: string) => CleanUp;

export type PointerDateTime = {
  dateTime?: Moment;
  type?: "dateTime" | "date";
};

export interface ObsidianContext {
  workspaceFacade: WorkspaceFacade;
  initWeeklyView: () => Promise<void>;
  refreshTasks: (source: string) => void;
  dataviewLoaded: Readable<boolean>;
  renderMarkdown: RenderMarkdown;
  toggleCheckboxInFile: VaultFacade["toggleCheckboxInFile"];
  editContext: ReturnType<typeof useEditContext>;
  showPreview: ShowPreview;
  isModPressed: Readable<boolean>;
  reSync: () => void;
  isOnline: Readable<boolean>;
  isDarkMode: { current: boolean };
  settings: Writable<DayPlannerSettings>;
  settingsSignal: { current: DayPlannerSettings };
  pointerDateTime: Readable<PointerDateTime>;
  pointerOffsetY: Writable<number>;
  pointerDate: Writable<string>;
  tasksWithActiveClockProps: Readable<LocalTask[]>;
  sTaskEditor: STaskEditor;
  getDisplayedTasksWithClocksForTimeline: (
    day: Moment,
  ) => Readable<Array<WithPlacing<LocalTask>>>;
  dispatch: AppDispatch;
  store: AppStore;
  useSelector: ReturnType<typeof createUseSelector>;
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

export type DateRange = Writable<Moment[]> & { untrack: () => void };

export type ReduxExtraArgument = {
  dataviewFacade: DataviewFacade;
};
