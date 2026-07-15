import type Fraction from "fraction.js";
import type { Moment } from "moment";
import type { MetadataCache, Vault } from "obsidian";
import type { Readable, Writable } from "svelte/store";

import type { IcalParseTaskResult } from "./redux/ical/init-ical-listeners";
import { type AppDispatch, type RootState } from "./redux/store";
import type { UseSelector } from "./redux/use-selector";
import type { IndexService } from "./service/index/index-service";
import type { ListPropsParser } from "./service/list-props-parser";
import type { LogEntryEditor } from "./service/log-entry-editor";
import type { PeriodicNotes } from "./service/periodic-notes";
import type { VaultFacade } from "./service/vault-facade";
import type { WorkspaceFacade } from "./service/workspace-facade";
import type { DayPlannerSettings, IcalConfig } from "./settings";
import type { EditableTimeBlock } from "./time-block-types";
import type { OpenEditTimeEntryModal } from "./ui/create-edit-time-entry-modal";
import { EditMode } from "./ui/hooks/use-edit/types";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import type { createRenderMarkdown } from "./util/create-render-markdown";
import { type ShowPreview } from "./util/create-show-preview";
import type { Scheduler } from "./util/scheduler";

export type OnUpdateFn = (
  base: Array<EditableTimeBlock>,
  next: Array<EditableTimeBlock>,
  mode: EditMode,
) => Promise<boolean>;

export type OnEditAbortedFn = () => void;

export type RelationToNow = "past" | "present" | "future";

export interface Overlap {
  columns: number;
  span: number;
  start: number;
  fraction?: Fraction;
}

export type CleanUp = () => void;
export type RenderMarkdown = ReturnType<typeof createRenderMarkdown>;

export type PointerDateTime = {
  dateTime: Moment;
  type: "dateTime" | "date";
};

export type Signal<T> = { current: T };

export interface ObsidianContext {
  workspaceFacade: WorkspaceFacade;
  periodicNotes: PeriodicNotes;
  initWeeklyView: () => Promise<void>;
  renderMarkdown: RenderMarkdown;
  toggleCheckboxInFile: VaultFacade["toggleCheckboxInFile"];
  editContext: ReturnType<typeof useEditContext>;
  showPreview: ShowPreview;
  isModPressed: Readable<boolean>;
  reSync: () => void;
  isOnline: Readable<boolean>;
  isDarkMode: Signal<boolean>;
  settings: Writable<DayPlannerSettings>;
  settingsSignal: Signal<DayPlannerSettings>;
  pointerDateTime: Writable<PointerDateTime>;
  logEntryEditor: LogEntryEditor;
  openEditTimeEntryModal: OpenEditTimeEntryModal;
  // todo: rename to promptUserToEditText
  editText: (props: {
    initialText?: string;
    getDescriptionText: (value: string) => string;
  }) => Promise<string | undefined>;
  editLine: (target: {
    path: string;
    position: { line: number; col: number };
    contents: string;
  }) => Promise<void>;
  dispatch: AppDispatch;
  useSelector: UseSelector<RootState>;
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
  settings: DayPlannerSettings;
  listPropsParser: ListPropsParser;
  indexServices: IndexService[];
  vault: Vault;
  metadataCache: MetadataCache;
  periodicNotes: PeriodicNotes;
  icalParseScheduler: Scheduler<IcalParseTaskResult>;
};
