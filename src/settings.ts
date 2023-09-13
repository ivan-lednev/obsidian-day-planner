import type { HexString } from "obsidian";

export class DayPlannerSettings {
  circularProgress: boolean = false;
  nowAndNextInStatusBar: boolean = false;
  showTaskNotification: boolean = false;
  zoomLevel: number = 2;
  timelineIcon: string = "calendar-with-checkmark";
  endLabel: string = "All done";
  startHour: number = 6;
  timelineDateFormat: string = "LLLL";
  centerNeedle: boolean = false;
  plannerHeading: string = "Day planner";
  plannerHeadingLevel: number = 1;
  timelineColored: boolean = false;
  timelineStartColor: HexString = "#006466";
  timelineEndColor: HexString = "#4d194d";
}
