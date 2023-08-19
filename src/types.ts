import type { Moment } from "moment";

export interface PlanItemLocation {
  path: string;
  line: number;
}

export interface PlanItem {
  startTime: Moment;
  endTime: Moment;
  rawStartTime: string;
  rawEndTime: string;
  listTokens: string;
  text: string;
  durationMinutes: number;
  startMinutes: number;
  endMinutes: number;
  location?: PlanItemLocation;
  id: string;
}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<PlanItem, "startMinutes" | "endMinutes" | "id">;

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}
