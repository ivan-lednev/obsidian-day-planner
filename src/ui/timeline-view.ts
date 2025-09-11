import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import type { Component } from "svelte";

import { dateRangeContextKey, viewTypeTimeline } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext, DateRange } from "../types";
import { handleActiveLeafChange } from "../util/handle-active-leaf-change";

import TimelineWithControls from "./components/timeline-with-controls.svelte";
import { useDateRanges } from "./hooks/use-date-ranges";

import type { PeriodicNotes } from "src/service/periodic-notes";

export default class TimelineView extends ItemView {
  private timeline?: Component;
  private dateRange?: DateRange;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settings: () => DayPlannerSettings,
    private readonly componentContext: ComponentContext,
    private readonly dateRanges: ReturnType<typeof useDateRanges>,
    private readonly periodicNotes: PeriodicNotes,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeTimeline;
  }

  getDisplayText(): string {
    return "Timeline";
  }

  getIcon() {
    return this.settings().timelineIcon;
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    contentEl.addClass("planner-flex-container");

    this.dateRange = this.dateRanges.trackRange([window.moment()]);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!this.dateRange) {
          return;
        }

        handleActiveLeafChange(leaf, this.dateRange, this.periodicNotes);
      }),
    );

    const context = new Map([
      ...this.componentContext,
      [dateRangeContextKey, this.dateRange],
    ]);

    // @ts-expect-error
    this.timeline = mount(TimelineWithControls, {
      target: contentEl,
      context,
    });
  }

  async onClose() {
    if (this.timeline) {
      await unmount(this.timeline);
    }

    this.dateRange?.untrack();
  }
}
