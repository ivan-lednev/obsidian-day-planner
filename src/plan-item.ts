import type { Moment } from "moment/moment";

export interface PlanItem {
  matchIndex: number;
  startTime: Moment;
  endTime: Moment;
  rawStartTime: string;
  rawEndTime: string;
  text: string;
  durationMinutes: number;
  startMinutes: number;
  endMinutes: number;
}
