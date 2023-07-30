import { ItemView, WorkspaceLeaf } from "obsidian";
import Timeline from "./components/timeline.svelte";
import {
  planSummary,
  now,
  nowPosition,
  zoomLevel,
  tasks,
} from "../timeline-store";
import { VIEW_TYPE_TIMELINE } from "../constants";
import type { PlanSummaryData } from "../plan-data";
import type { DayPlannerSettings } from "../settings";
import {
  getMinutesSinceMidnight,
  getMinutesSinceMidnightTo,
} from "../time-utils";

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
    planSummary.update((n) => summaryData);
    tasks.update(() =>
      summaryData.items.map((task) => ({
        durationMinutes: task.durationMins,
        startMinutes: getMinutesSinceMidnightTo(task.startTime),
        text: task.text,
      })),
    );
    const currentTime = new Date();
    now.update((n) => (n = currentTime));
    const currentPosition = summaryData.empty
      ? 0
      : this.positionFromTime(currentTime) -
        this.positionFromTime(summaryData.items.first().startTime);

    // todo: update in settings, this is absolutely not needed
    // todo: remove?
    nowPosition.update(() => currentPosition);
  }

  positionFromTime(time: Date) {
    return (
      moment.duration(moment(time).format("HH:mm")).asMinutes() *
      Number(this.settings.timelineZoomLevel)
    );
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    this.timeline = new Timeline({
      target: contentEl,
      props: {
        rootEl: contentEl,
      },
    });
  }

  onunload() {
    this.timeline.$destroy();
  }
}
