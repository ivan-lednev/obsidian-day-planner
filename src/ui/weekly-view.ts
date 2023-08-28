import { ItemView, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_WEEKLY } from "../constants";
import type DayPlanner from "../main";
import type { DayPlannerSettings } from "../settings";
import { refreshPlanItemsInStore } from "../util/obsidian";

import HeaderActions from "./components/header-actions.svelte";
import Week from "./components/week.svelte";

export default class WeeklyView extends ItemView {
  private weekComponent: Week;
  private headerActionsComponent: HeaderActions;
  private settings: DayPlannerSettings;

  constructor(leaf: WorkspaceLeaf, plugin: DayPlanner) {
    super(leaf);
    this.settings = plugin.settings;
  }

  getViewType(): string {
    return VIEW_TYPE_WEEKLY;
  }

  getDisplayText(): string {
    const startOfWeek = window.moment().startOf("isoWeek").format("MMM, D");
    const endOfWeek = window.moment().endOf("isoWeek").format("MMM, D");

    return `${startOfWeek} - ${endOfWeek}`;
  }

  getIcon() {
    return this.settings.timelineIcon;
  }

  async onOpen() {
    await refreshPlanItemsInStore(); // todo: clean up

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
