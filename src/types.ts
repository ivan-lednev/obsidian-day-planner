import type { Moment } from "moment";
import { MetadataCache, Pos } from "obsidian";

import type { settingsWithUtils } from "./global-store/settings-with-utils";
import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import { DataviewFacade } from "./service/dataview-facade";
import type { ObsidianFacade } from "./service/obsidian-facade";

export interface PlanItemLocation {
  path: string;
  line: number;
  position: Pos;
}

export type OnUpdateFn = (
  baseline: PlanItem[],
  updated: PlanItem[],
) => Promise<void | void[]>;

export interface PlanItem {
  startTime: Moment;
  /**
   * @deprecated this will be replaced with dataview `symbol` and `status`
   */
  listTokens: string;
  firstLineText: string;
  text: string;
  durationMinutes: number;
  startMinutes: number;
  location?: PlanItemLocation;
  id: string;
  /**
   * @deprecated derive it from startTime instead
   */
  rawStartTime: string;
  /**
   * @deprecated derive it from startTime and duration instead
   */
  rawEndTime: string;
}

export interface PlacedPlanItem extends PlanItem {
  placing: ReturnType<typeof getHorizontalPlacing>;
  isGhost?: boolean;
}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<
  PlanItem,
  "startMinutes" | "durationMinutes" | "id"
>;

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}

export type Timestamp = {
  startMinutes: number;
  durationMinutes: number;
};

export type ReactiveSettingsWithUtils = typeof settingsWithUtils;

export interface ObsidianContext {
  obsidianFacade: ObsidianFacade;
  dataviewFacade: DataviewFacade;
  metadataCache: MetadataCache;
  onUpdate: OnUpdateFn;
  initWeeklyView: () => Promise<void>;
}
