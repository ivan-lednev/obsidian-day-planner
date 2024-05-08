import { ItemView, WorkspaceLeaf } from "obsidian";

import { dateRangeContextKey, viewTypeWeekly } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext, DateRange } from "../types";
import { getDaysOfCurrentWeek } from "../util/moment";

import HeaderActions from "./components/week/header-actions.svelte";
import Week from "./components/week/week.svelte";
import { useDateRanges } from "./hooks/use-date-ranges";
import { store } from "../store";
import { dateRangeClosed, dateRangeOpened } from "../obsidianSlice";
import { getId } from "../util/id";
import { getDayKey } from "../util/tasks-utils";

export default class WeeklyView extends ItemView {
  private weekComponent: Week;
  private headerActionsComponent: HeaderActions;
  private dateRange: DateRange;
  private dateRangeKey: string;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: () => DayPlannerSettings,
    private readonly componentContext: ComponentContext,
    private readonly dateRanges: ReturnType<typeof useDateRanges>,
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

    this.dateRange = this.dateRanges.trackRange(getDaysOfCurrentWeek());
    this.dateRangeKey = getId();
    store.dispatch(
      dateRangeOpened({ id: this.dateRangeKey, range: getDaysOfCurrentWeek().map(getDayKey) }),
    );

    const context = new Map([
      ...this.componentContext,
      [dateRangeContextKey, this.dateRange],
    ]);

    this.headerActionsComponent = new HeaderActions({
      target: customActionsEl,
      context,
    });

    this.weekComponent = new Week({
      target: contentEl,
      context,
    });
  }

  async onClose() {
    this.dateRange.untrack();
    store.dispatch(dateRangeClosed(this.dateRangeKey));

    this.weekComponent?.$destroy();
    this.headerActionsComponent?.$destroy();
  }
}
