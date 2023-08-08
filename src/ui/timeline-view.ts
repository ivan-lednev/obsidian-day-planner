import { ItemView, WorkspaceLeaf } from "obsidian";
import Timeline from "./components/timeline.svelte";
import {
  appStore,
  centerNeedle,
  startHour,
  timelineDateFormat,
  zoomLevel,
} from "../store/timeline-store";
import { VIEW_TYPE_TIMELINE } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type DayPlanner from "../main";

export default class TimelineView extends ItemView {
  private timeline: Timeline;
  private settings: DayPlannerSettings;

  constructor(
    leaf: WorkspaceLeaf,
    settings: DayPlannerSettings,
    private readonly plugin: DayPlanner,
  ) {
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

  async onOpen() {
    this.initStore();

    const contentEl = this.containerEl.children[1];
    this.timeline = new Timeline({
      target: contentEl,
    });
  }

  initStore() {
    appStore.set(this.app);
    zoomLevel.set(this.settings.timelineZoomLevel);
    zoomLevel.subscribe(async (value) => {
      this.plugin.settings.timelineZoomLevel = value;
      await this.plugin.saveData(this.plugin.settings);
    });

    centerNeedle.set(this.settings.centerNeedle);
    centerNeedle.subscribe(async (value) => {
      this.plugin.settings.centerNeedle = value;
      await this.plugin.saveData(this.plugin.settings);
    });

    startHour.set(this.settings.startHour);
    startHour.subscribe(async (value) => {
      this.plugin.settings.startHour = value;
      await this.plugin.saveData(this.plugin.settings);
    });

    timelineDateFormat.set(this.settings.timelineDateFormat);
  }

  async onClose() {
    this.timeline?.$destroy();
  }
}
