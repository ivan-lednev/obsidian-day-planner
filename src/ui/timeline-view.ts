import { ItemView, WorkspaceLeaf } from "obsidian";
import Timeline from "./components/timeline.svelte";
import {
  centerNeedle,
  startHour,
  tasks,
  timelineDateFormat,
  zoomLevel,
} from "../timeline-store";
import { VIEW_TYPE_TIMELINE } from "../constants";
import type { PlanSummaryData } from "../plan-data";
import type { DayPlannerSettings } from "../settings";
import { getMinutesSinceMidnightTo } from "../time-utils";

export default class TimelineView extends ItemView {
  private timeline: Timeline;
  private settings: DayPlannerSettings;

  constructor(leaf: WorkspaceLeaf, settings: DayPlannerSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType(): string {
    return VIEW_TYPE_TIMELINE;
  }

  getDisplayText(): string {
    return "Day Planner Timeline";
  }

  getIcon() {
    return this.settings.timelineIcon;
  }

  update(summaryData: PlanSummaryData) {
    tasks.update(() =>
      summaryData.items.map((task) => {
        const defaultDurationMinutes = 30;

        return {
          durationMinutes: task.durationMins || defaultDurationMinutes,
          startMinutes: getMinutesSinceMidnightTo(task.startTime),
          text: task.text,
        };
      }),
    );
  }

  async onOpen() {
    this.initializeStoresFromSettings();

    const contentEl = this.containerEl.children[1];
    this.timeline = new Timeline({
      target: contentEl,
    });
  }

  initializeStoresFromSettings() {
    zoomLevel.set(this.settings.timelineZoomLevel);
    startHour.set(this.settings.startHour);
    centerNeedle.set(this.settings.centerNeedle);
    timelineDateFormat.set(this.settings.timelineDateFormat);
  }

  onunload() {
    this.timeline.$destroy();
  }
}
