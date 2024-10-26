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
import * as r from "../util/range";
import { get } from "svelte/store";

export default class WeeklyView extends ItemView {
  navigation = false;
  private weekComponent?: typeof Week;
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
    if (!this.dateRange) {
      return "Multi-Day View";
    }

    return r.toString(get(this.dateRange));
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
    this.register(
      this.dateRange.subscribe((next) => {
        const newText = r.toString(next);

        // @ts-expect-error: undocumented API
        this.titleEl?.setText(newText);
        // @ts-expect-error: undocumented API
        this.leaf.updateHeader?.();
      }),
    );

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
      // @ts-expect-error
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
