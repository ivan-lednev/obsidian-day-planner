import { DayPlannerMode } from "./types";

export class DayPlannerSettings {
  mode: DayPlannerMode = DayPlannerMode.DAILY;
  completePastItems: boolean = true;
  circularProgress: boolean = false;
  nowAndNextInStatusBar: boolean = false;
  showTaskNotification: boolean = false;
  timelineZoomLevel: string = "2";
  timelineIcon: string = "calendar-with-checkmark";
  breakLabel: string = "BREAK";
  endLabel: string = "END";
  startHour: number = 6;
  timelineDateFormat: string = "LLLL";
  centerNeedle: boolean = true;
  plannerHeading: string = "Day planner";
  plannerHeadingLevel: number = 1;
}
