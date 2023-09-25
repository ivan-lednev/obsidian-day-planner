import type { HexString } from "obsidian";

export interface DayPlannerSettings {
  circularProgress: boolean;
  nowAndNextInStatusBar: boolean;
  showTaskNotification: boolean;
  zoomLevel: number;
  timelineIcon: string;
  endLabel: string;
  startHour: number;
  timelineDateFormat: string;
  centerNeedle: boolean;
  showHelp: boolean;
  plannerHeading: string;
  plannerHeadingLevel: number;
  timelineColored: boolean;
  timelineStartColor: HexString;
  timelineEndColor: HexString;
  timestampFormat: string;
}

export const defaultSettings = {
  circularProgress: false,
  nowAndNextInStatusBar: false,
  showTaskNotification: false,
  zoomLevel: 2,
  timelineIcon: "calendar-with-checkmark",
  endLabel: "All done",
  startHour: 6,
  timelineDateFormat: "LLLL",
  centerNeedle: false,
  showHelp: true,
  plannerHeading: "Day planner",
  plannerHeadingLevel: 1,
  timelineColored: false,
  timelineStartColor: "#006466",
  timelineEndColor: "#4d194d",
  timestampFormat: "HH:mm",
};

export const defaultSettingsForTests = {
  ...defaultSettings,
  startHour: 0,
  zoomLevel: 1,
};
