import type { DayPlannerSettings } from "../settings";

import { PlanItem } from "./plan-item";

export class PlanItemFactory {
  private settings: DayPlannerSettings;

  constructor(settings: DayPlannerSettings) {
    this.settings = settings;
  }

  getPlanItem(
    matchIndex: number,
    isCompleted: boolean,
    isBreak: boolean,
    isEnd: boolean,
    startTime: Date,
    endTime: Date,
    rawStartTime: string,
    rawEndTime: string,
    text: string,
    raw: string
  ) {
    const displayText = this.getDisplayText(isBreak, isEnd, text);
    return new PlanItem(
      matchIndex,
      isCompleted,
      isBreak,
      isEnd,
      startTime,
      endTime,
      rawStartTime,
      rawEndTime,
      displayText,
      raw
    );
  }

  getDisplayText(isBreak: boolean, isEnd: boolean, text: string) {
    if (isBreak) {
      return this.settings.breakLabel;
    }
    if (isEnd) {
      return this.settings.endLabel;
    }
    return text;
  }
}
