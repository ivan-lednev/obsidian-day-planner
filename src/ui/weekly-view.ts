import { ItemView, WorkspaceLeaf } from "obsidian";

import { viewTypeWeekly } from "../constants";
import type DayPlanner from "../main";
import type { DayPlannerSettings } from "../settings";

import HeaderActions from "./components/week/header-actions.svelte";
import Week from "./components/week/week.svelte";

export default class WeeklyView extends ItemView {
  private weekComponent: Week;
  private headerActionsComponent: HeaderActions;
  private settings: DayPlannerSettings;

  constructor(leaf: WorkspaceLeaf, plugin: DayPlanner) {
    super(leaf);
    this.settings = plugin.settings;
  }

  getViewType(): string {
    return viewTypeWeekly;
  }

  getDisplayText(): string {
    return "Week Planner";
  }

  getIcon() {
    return this.settings.timelineIcon;
  }

  async onOpen() {
    const headerEl = this.containerEl.children[0];
    const contentEl = this.containerEl.children[1];

    const viewActionsEl = headerEl.querySelector(".view-actions");

    const customActionsEl = createDiv();
    viewActionsEl.prepend(customActionsEl);

    this.headerActionsComponent = new HeaderActions({
      target: customActionsEl,
    });

    this.weekComponent = new Week({
      target: contentEl,
    });
  }

  async onClose() {
    this.weekComponent?.$destroy();
    this.headerActionsComponent?.$destroy();
  }
}
