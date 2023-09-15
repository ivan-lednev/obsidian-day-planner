import { ItemView, WorkspaceLeaf } from "obsidian";

import { viewTypeTimeline } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ObsidianFacade } from "../util/obsidian-facade";
import type { PlanEditor } from "../util/plan-editor";

import Timeline from "./components/timeline.svelte";

export default class TimelineView extends ItemView {
  private timeline: Timeline;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
    private readonly planEditor: PlanEditor,
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
        onUpdate: this.planEditor.syncWithFile,
      },
    });
  }

  async onClose() {
    this.timeline?.$destroy();
  }
}
