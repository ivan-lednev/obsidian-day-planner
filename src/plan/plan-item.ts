export class PlanItem {
  matchIndex: number;
  isCompleted: boolean;
  isPast: boolean;
  isBreak: boolean;
  isEnd: boolean;
  startTime: Date;
  endTime: Date;
  durationMins: number;
  rawStartTime: string;
  rawEndTime: string;
  text: string;

  constructor(
    matchIndex: number,
    isCompleted: boolean,
    isBreak: boolean,
    isEnd: boolean,
    startTime: Date,
    endTime: Date,
    rawStartTime: string,
    rawEndTime: string,
    text: string,
  ) {
    this.matchIndex = matchIndex;
    this.isCompleted = isCompleted;
    this.isBreak = isBreak;
    this.isEnd = isEnd;
    this.startTime = startTime;
    this.endTime = endTime;
    this.rawStartTime = rawStartTime;
    this.rawEndTime = rawEndTime;
    this.text = text;
  }
}
