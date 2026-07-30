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
import type { EditableTimeBlock, PlanTimeBlock } from "./time-block-types";
import { EditMode } from "./ui/hooks/use-edit/types";
import { useEditContext } from "./ui/hooks/use-edit/use-edit-context";
import type { OpenLogEntryEditModal } from "./ui/log-entry-edit-modal";
import type { OpenTimelineSettingsModal } from "./ui/timeline-settings-modal";
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

export type RenderMarkdown = ReturnType<typeof createRenderMarkdown>;

export type PointerDateTime = {
  dateTime: Moment;
  type: "dateTime" | "date";
};

/**
 * Naming: `settings` is always a plain `DayPlannerSettings` value,
 * `settingsStore` is always the writable store and `settingsSignal` is always
 * the signal over it. The `Signal` suffix is only carried where a same-named
 * store exists to disambiguate from — signals without a store counterpart
 * (`isDarkMode`, everything `useSelector` returns) go unsuffixed.
 */
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
  settingsStore: Writable<DayPlannerSettings>;
  settingsSignal: Signal<DayPlannerSettings>;
  pointerDateTime: Writable<PointerDateTime>;
  logEntryEditor: LogEntryEditor;
  openLogEntryEditModal: OpenLogEntryEditModal;
  openTimelineSettingsModal: OpenTimelineSettingsModal;
  openClockInOnAnythingModal: () => void;
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
  deleteTimeBlock: (task: PlanTimeBlock) => Promise<void>;
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

export type ReduxExtraArgument = {
  settings: DayPlannerSettings;
  listPropsParser: ListPropsParser;
  indexServices: IndexService[];
  vault: Vault;
  metadataCache: MetadataCache;
  periodicNotes: PeriodicNotes;
  icalParseScheduler: Scheduler<IcalParseTaskResult>;
};
