import type { Moment } from "moment/moment";

export interface PlanItem {
  matchIndex: number;
  isCompleted: boolean;
  startTime: Moment;
  endTime: Moment;
  rawStartTime: string;
  rawEndTime: string;
  text: string;
  isPast?: boolean;
  isEnd?: boolean;
  durationMins?: number;
}
