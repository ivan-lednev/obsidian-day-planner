import type { HexString } from "obsidian";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";

export interface IcalConfig {
  name: string;
  email?: string;
  url: string;
  color: string;
}

export interface ColorOverride {
  text: string;
  color: string;
  darkModeColor: string;
}

export const eventFormats = ["task", "bullet"] as const;

export interface DayPlannerSettings {
  progressIndicator: "pie" | "bar" | "none";
  showTaskNotification: boolean;
  zoomLevel: number;
  timelineIcon: string;
  endLabel: string;
  startHour: number;
  timelineDateFormat: string;
  centerNeedle: boolean;
  plannerHeading: string;
  plannerHeadingLevel: number;
  timelineColored: boolean;
  timelineStartColor: HexString;
  timelineEndColor: HexString;
  timestampFormat: string;
  hourFormat: string;
  dataviewSource: string;
  extendDurationUntilNext: boolean;
  defaultDurationMinutes: number;
  minimalDurationMinutes: number;
  showTimestampInTaskBlock: boolean;
  showUncheduledTasks: boolean;
  showUnscheduledNestedTasks: boolean;
  showNow: boolean;
  showNext: boolean;
  snapStepMinutes: number;
  pluginVersion: string;
  showCompletedTasks: boolean;
  showSubtasksInTaskBlocks: boolean;
  icals: Array<IcalConfig>;
  colorOverrides: Array<ColorOverride>;
  releaseNotes: boolean;
  taskStatusOnCreation: string;
  eventFormatOnCreation: (typeof eventFormats)[number];
  sortTasksInPlanAfterEdit: boolean;
}

export const defaultSettings: DayPlannerSettings = {
  snapStepMinutes: 10,
  progressIndicator: "bar",
  showTaskNotification: false,
  zoomLevel: 2,
  timelineIcon: "calendar-with-checkmark",
  endLabel: "All done",
  startHour: 6,
  timelineDateFormat: DEFAULT_DAILY_NOTE_FORMAT,
  centerNeedle: false,
  plannerHeading: "Day planner",
  plannerHeadingLevel: 1,
  timelineColored: false,
  timelineStartColor: "#006466",
  timelineEndColor: "#4d194d",
  timestampFormat: "HH:mm",
  hourFormat: "H",
  dataviewSource: "",
  extendDurationUntilNext: false,
  defaultDurationMinutes: 30,
  minimalDurationMinutes: 10,
  showTimestampInTaskBlock: false,
  showUncheduledTasks: true,
  showUnscheduledNestedTasks: true,
  showNow: true,
  showNext: true,
  pluginVersion: "",
  showCompletedTasks: true,
  showSubtasksInTaskBlocks: true,
  icals: [],
  colorOverrides: [],
  releaseNotes: true,
  taskStatusOnCreation: " ",
  eventFormatOnCreation: "task",
  sortTasksInPlanAfterEdit: false,
};

export const defaultSettingsForTests = {
  ...defaultSettings,
  startHour: 0,
  zoomLevel: 1,
};
