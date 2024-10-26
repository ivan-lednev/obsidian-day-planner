import { range } from "lodash/fp";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import { match } from "ts-pattern";

import { dateRangeContextKey, viewTypeWeekly } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext, DateRange } from "../types";
import { getFullWeekFromDay, getMomentFromDayOfWeek } from "../util/moment";

import HeaderActions from "./components/week/header-actions.svelte";
import Week from "./components/week/week.svelte";
import { useDateRanges } from "./hooks/use-date-ranges";

export default class WeeklyView extends ItemView {
  private weekComponent?: Week;
  private headerActionsComponent?: HeaderActions;
  private dateRange?: DateRange;

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
    const firstDayOfWeek = getMomentFromDayOfWeek(
      this.settings().firstDayOfWeek,
    );

    const today = window.moment();
    const initialRange = match(this.settings().multiDayRange)
      .with("full-week", () => getFullWeekFromDay(firstDayOfWeek))
      .with("3-days", () =>
        range(1, 3).reduce(
          (result, dayIndex) => {
            result.push(today.clone().add(dayIndex, "day"));

            return result;
          },
          [today],
        ),
      )
      .with("work-week", () => {
        throw new Error("Not implemented");
      })
      .exhaustive();

    this.dateRange = this.dateRanges.trackRange(initialRange);

    const context = new Map([
      ...this.componentContext,
      [dateRangeContextKey, this.dateRange],
    ]);

    // @ts-expect-error
    this.weekComponent = mount(Week, {
      target: contentEl,
      context,
    });

    const viewActionsEl = headerEl.querySelector(".view-actions");

    if (viewActionsEl) {
      const customActionsEl = createDiv();

      viewActionsEl.prepend(customActionsEl);
      this.headerActionsComponent = mount(HeaderActions, {
        target: customActionsEl,
        context,
      });
    }
  }

  async onClose() {
    this.dateRange?.untrack();

    if (this.weekComponent) {
      unmount(this.weekComponent);
    }

    if (this.headerActionsComponent) {
      unmount(this.headerActionsComponent);
    }
  }
}
