import type { HexString } from "obsidian";

import { defaultDayFormat } from "./constants";
import type { RawIcal } from "./redux/ical/ical-slice";

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
export const firstDaysOfWeek = [
  "monday",
  "sunday",
  "saturday",
  "friday",
] as const;

export type TimelineColumnType = "timeTracker" | "planner";
export type TimelineColumns = Record<TimelineColumnType, boolean>;

export interface DayPlannerSettings {
  progressIndicator: "mini-timeline" | "pie" | "bar" | "none";
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
  showTimelineInSidebar: boolean;
  showNow: boolean;
  showNext: boolean;
  showActiveClocks: boolean;
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
  firstDayOfWeek: (typeof firstDaysOfWeek)[number];
  multiDayRange: "full-week" | "work-week" | "3-days";
  timelineColumns: TimelineColumns;
}

export interface Cache {
  rawIcals: Array<RawIcal>;
}

export type PluginData = DayPlannerSettings & Cache;

export const defaultSettings: DayPlannerSettings = {
  snapStepMinutes: 10,
  progressIndicator: "mini-timeline",
  showTaskNotification: false,
  zoomLevel: 2,
  timelineIcon: "calendar-with-checkmark",
  endLabel: "All done",
  startHour: 6,
  timelineDateFormat: defaultDayFormat,
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
  firstDayOfWeek: "monday",
  multiDayRange: "3-days",
  showActiveClocks: false,
  showTimelineInSidebar: true,
  timelineColumns: { planner: true, timeTracker: false },
};

export const defaultSettingsForTests = {
  ...defaultSettings,
  startHour: 0,
  zoomLevel: 1,
};
