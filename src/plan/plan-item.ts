export interface PlanItem {
  matchIndex: number;
  isCompleted: boolean;
  isBreak: boolean;
  isEnd: boolean;
  startTime: Date;
  endTime: Date;
  rawStartTime: string;
  rawEndTime: string;
  text: string;
  isPast?: boolean;
  durationMins?: number;
}
