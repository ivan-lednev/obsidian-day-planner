import { ItemView, WorkspaceLeaf } from "obsidian";

import { obsidianContext, viewTypeWeekly } from "../constants";
import type { ObsidianFacade } from "../service/obsidian-facade";
import type { PlanEditor } from "../service/plan-editor";
import type { DayPlannerSettings } from "../settings";

import HeaderActions from "./components/week/header-actions.svelte";
import Week from "./components/week/week.svelte";

export default class WeeklyView extends ItemView {
  private weekComponent: Week;
  private headerActionsComponent: HeaderActions;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: () => DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
    private readonly planEditor: PlanEditor,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeWeekly;
  }

  getDisplayText(): string {
    return "Week Planner";
  }

  getIcon() {
    return this.settings().timelineIcon;
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
      context: new Map([
        [
          obsidianContext,
          {
            obsidianFacade: this.obsidianFacade,
            onUpdate: this.planEditor.syncTasksWithFile,
          },
        ],
      ]),
    });
  }

  async onClose() {
    this.weekComponent?.$destroy();
    this.headerActionsComponent?.$destroy();
  }
}
