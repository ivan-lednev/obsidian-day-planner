import { ItemView, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_WEEKLY } from "../constants";
import type DayPlanner from "../main";
import type { DayPlannerSettings } from "../settings";

import Week from "./components/week.svelte";

export default class WeeklyView extends ItemView {
  private weekComponent: Week;
  private settings: DayPlannerSettings;

  constructor(leaf: WorkspaceLeaf, plugin: DayPlanner) {
    super(leaf);
    this.settings = plugin.settings;
  }

  getViewType(): string {
    return VIEW_TYPE_WEEKLY;
  }

  getDisplayText(): string {
    return "Week Planner Timeline";
  }

  getIcon() {
    return this.settings.timelineIcon;
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];
    this.weekComponent = new Week({
      target: contentEl,
    });
  }

  async onClose() {
    this.weekComponent?.$destroy();
  }
}
