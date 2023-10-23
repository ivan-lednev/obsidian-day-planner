import { ItemView, WorkspaceLeaf } from "obsidian";

import { viewTypeTimeline } from "../constants";
import type { DayPlannerSettings } from "../settings";

import TaskContainer from "./components/task-container.svelte";

export default class TimelineView extends ItemView {
  private timeline: TaskContainer;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: () => DayPlannerSettings,
    private readonly componentContext: Map<string, Record<string, unknown>>,
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
    return this.settings().timelineIcon;
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];
    this.timeline = new TaskContainer({
      target: contentEl,
      context: this.componentContext,
    });
  }

  async onClose() {
    this.timeline?.$destroy();
  }
}
