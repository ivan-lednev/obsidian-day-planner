import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import { get, type Writable } from "svelte/store";

import { dateRangeContextKey, viewTypeWeekly } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext, DateRange } from "../types";
import * as range from "../util/range";

import HeaderActions from "./components/multi-day/header-actions.svelte";
import Week from "./components/multi-day/multi-day-grid.svelte";
import { useDateRanges } from "./hooks/use-date-ranges";

export default class MultiDayView extends ItemView {
  navigation = false;
  private weekComponent?: typeof Week;
  private headerActionsComponent?: HeaderActions;
  private dateRange?: DateRange;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: Writable<DayPlannerSettings>,
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

    return range.toString(get(this.dateRange));
  }

  getIcon() {
    return "table-2";
  }

  async onOpen() {
    const headerEl = this.containerEl.children[0];
    const contentEl = this.containerEl.children[1];
    const currentSettings = get(this.settings);

    this.dateRange = this.dateRanges.trackRange(
      range.createRange(
        currentSettings.multiDayRange,
        currentSettings.firstDayOfWeek,
      ),
    );

    this.register(
      this.dateRange.subscribe((next) => {
        const newText = range.toString(next);

        // @ts-expect-error: undocumented API
        this.titleEl?.setText(newText);
        // @ts-expect-error: undocumented API
        this.leaf.updateHeader?.();
      }),
    );

    // todo: remove manual state synchronization
    this.register(
      this.settings.subscribe((next) => {
        this.dateRange?.set(
          range.createRange(next.multiDayRange, next.firstDayOfWeek),
        );
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
