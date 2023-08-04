export interface PlanItem {
  matchIndex: number;
  isCompleted: boolean;
  startTime: Date;
  endTime: Date;
  rawStartTime: string;
  rawEndTime: string;
  text: string;
  isPast?: boolean;
  durationMins?: number;
}
