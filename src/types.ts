import type Fraction from "fraction.js";
import type { Moment } from "moment";
import type { Readable, Writable } from "svelte/store";

import type { RawIcal } from "./redux/ical/ical-slice";
import { type AppDispatch } from "./redux/store";
import type { UseSelector } from "./redux/use-selector";
import type { DataviewFacade } from "./service/dataview-facade";
import type { ListPropsParser } from "./service/list-props-parser";
import type { PeriodicNotes } from "./service/periodic-notes";
import type { STaskEditor } from "./service/stask-editor";
import type { VaultFacade } from "./service/vault-facade";
import type { WorkspaceFacade } from "./service/workspace-facade";
import type { DayPlannerSettings, IcalConfig } from "./settings";
import type { LocalTask, WithPlacing } from "./task-types";
import { EditMode } from "./ui/hooks/use-edit/types";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import type { useTasks } from "./ui/hooks/use-tasks";
import { type ShowPreview } from "./util/create-show-preview";

export type OnUpdateFn = (
  base: Array<LocalTask>,
  next: Array<LocalTask>,
  mode: EditMode,
) => Promise<void>;

export type OnEditAbortedFn = () => void;

export type RelationToNow = "past" | "present" | "future";

export interface Overlap {
  columns: number;
  span: number;
  start: number;
  fraction?: Fraction;
}

export type CleanUp = () => void;
export type RenderMarkdown = (el: HTMLElement, markdown: string) => CleanUp;

export type PointerDateTime = {
  dateTime: Moment;
  type: "dateTime" | "date";
};

export type RefreshDataviewFn = (source: string) => Promise<unknown>;

export interface ObsidianContext {
  workspaceFacade: WorkspaceFacade;
  periodicNotes: PeriodicNotes;
  initWeeklyView: () => Promise<void>;
  refreshDataviewFn: RefreshDataviewFn;
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
  pointerDateTime: Writable<PointerDateTime>;
  tasksWithActiveClockProps: Readable<LocalTask[]>;
  logSummary: ReturnType<typeof useTasks>["logSummary"];
  sTaskEditor: STaskEditor;
  getDisplayedTasksWithClocksForTimeline: (
    day: Moment,
  ) => Readable<Array<WithPlacing<LocalTask>>>;
  dispatch: AppDispatch;
  useSelector: UseSelector;
}

export type ComponentContext = Map<string, unknown>;

declare global {
  /**
   * Placeholders expanded at build-time
   */
  const currentPluginVersion: string;
  const changelogMd: string;
  const supportBanner: string;
  const envMode: "development" | "production";
}

export type WithIcalConfig<T> = T & { calendar: IcalConfig };

export type DateRange = Writable<Moment[]> & { untrack: () => void };

export type ReduxExtraArgument = {
  dataviewFacade: DataviewFacade;
  listPropsParser: ListPropsParser;
  onIcalsFetched: (rawIcals: RawIcal[]) => Promise<void>;
};
