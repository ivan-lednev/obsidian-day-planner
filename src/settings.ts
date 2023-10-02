import type { HexString } from "obsidian";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";

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
  dataviewSource: string;
  showDataviewMigrationWarning: boolean;
  extendDurationUntilNext: boolean;
  defaultDurationMinutes: number;
  autoComplete: boolean;
}

export const defaultSettings = {
  circularProgress: false,
  nowAndNextInStatusBar: false,
  showTaskNotification: false,
  zoomLevel: 2,
  timelineIcon: "calendar-with-checkmark",
  endLabel: "All done",
  startHour: 6,
  timelineDateFormat: DEFAULT_DAILY_NOTE_FORMAT,
  centerNeedle: false,
  showHelp: true,
  plannerHeading: "Day planner",
  plannerHeadingLevel: 1,
  timelineColored: false,
  timelineStartColor: "#006466",
  timelineEndColor: "#4d194d",
  timestampFormat: "HH:mm",
  dataviewSource: "",
  showDataviewMigrationWarning: true,
  extendDurationUntilNext: false,
  defaultDurationMinutes: 30,
  autoComplete: false,
};

export const defaultSettingsForTests = {
  ...defaultSettings,
  startHour: 0,
  zoomLevel: 1,
};
