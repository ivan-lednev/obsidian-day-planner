import { ItemView, WorkspaceLeaf } from "obsidian";
import Timeline from "./components/timeline.svelte";
import { endOfDayCoords, tasks } from "../timeline-store";
import { VIEW_TYPE_TIMELINE } from "../constants";
import type { PlanSummaryData } from "../plan-data";
import type { DayPlannerSettings } from "../settings";
import {
  getMinutesSinceMidnight,
  getMinutesSinceMidnightTo,
} from "../time-utils";
import { get } from "svelte/store";

const moment = (window as any).moment;

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
        const defaultDurationMinutes = 30

        return {
          durationMinutes: task.durationMins || defaultDurationMinutes,
          startMinutes: getMinutesSinceMidnightTo(task.startTime),
          text: task.text,
        };
      }),
    );
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    this.timeline = new Timeline({ target: contentEl });
  }

  onunload() {
    this.timeline.$destroy();
  }
}
