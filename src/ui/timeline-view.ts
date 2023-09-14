import { ItemView, WorkspaceLeaf } from "obsidian";

import { viewTypeTimeline } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ObsidianFacade } from "../util/obsidian-facade";

import Timeline from "./components/timeline.svelte";

export default class TimelineView extends ItemView {
  private timeline: Timeline;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeTimeline;
  }

  getDisplayText(): string {
    return "Day Planner Timeline";
  }

  getIcon() {
    return this.settings.timelineIcon;
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];
    this.timeline = new Timeline({
      target: contentEl,
      props: {
        obsidianFacade: this.obsidianFacade,
      },
    });
  }

  async onClose() {
    this.timeline?.$destroy();
  }
}
