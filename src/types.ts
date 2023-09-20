import type { Moment } from "moment";

import type { settingsWithUtils } from "./global-store/settings-with-utils";
import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { ObsidianFacade } from "./service/obsidian-facade";

export interface PlanItemLocation {
  path: string;
  line: number;
}

export type OnUpdateFn = (
  baseline: PlanItem[],
  updated: PlanItem[],
) => Promise<void | void[]>;

export interface PlanItem {
  startTime: Moment;
  endTime: Moment;
  rawStartTime: string;
  rawEndTime: string;
  listTokens: string;
  text: string;
  firstLineText: string;
  durationMinutes: number;
  startMinutes: number;
  endMinutes: number;
  location?: PlanItemLocation;
  id: string;
}

export interface PlacedPlanItem extends PlanItem {
  placing: ReturnType<typeof getHorizontalPlacing>;
  isGhost?: boolean;
}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<PlanItem, "startMinutes" | "endMinutes" | "id">;

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
  onUpdate: OnUpdateFn;
}
