import { ItemView, WorkspaceLeaf } from "obsidian";
import Timeline from "./components/timeline.svelte";
import {
  appStore,
} from "../store/timeline-store";
import { settings } from "src/store/settings";
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
    const { zoomLevel, centerNeedle, startHour, timelineDateFormat } =
      this.settings;
    settings.set({
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat
    });
    settings.subscribe(async (newValue) => {
      this.plugin.settings = { ...this.plugin.settings, ...newValue };
      await this.plugin.saveData(this.plugin.settings);
    });
  }

  async onClose() {
    this.timeline?.$destroy();
  }
}
