import type { Moment } from "moment";
import type { Writable } from "svelte/store";

import type { getHorizontalPlacing } from "./util/horizontal-placing";

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
  isCompleted: boolean;
  isTask: boolean;
}

export interface PlacedPlanItem extends PlanItem {
  placing: ReturnType<typeof getHorizontalPlacing>;
}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<PlanItem, "startMinutes" | "endMinutes" | "id">;

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}

export interface TasksContext {
  tasks: Writable<Array<PlanItem>>;
  getTasks: () => Writable<Array<PlanItem>>;
}

export type Timestamp = {
  startMinutes: number;
  durationMinutes: number;
};
