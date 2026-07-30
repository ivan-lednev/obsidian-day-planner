import type { Moment } from "moment";
import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import type { Component } from "svelte";
import { get, toStore, writable, type Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import {
  dateRangeContextKey,
  isInSidebarContextKey,
  viewTypeTimeline,
} from "../constants";
import type { DateRange, DateRanges } from "../redux/date-ranges";
import type { PeriodicNotes } from "../service/periodic-notes";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext } from "../types";
import { handleActiveLeafChange } from "../util/handle-active-leaf-change";
import { setViewTitle } from "../util/view";

import TimelineWithControls from "./components/timeline-with-controls.svelte";
import type { OpenTimelineSettingsModal } from "./timeline-settings-modal";
import { addTimelineViewMenuItems } from "./timeline-view-menu";

export default class TimelineView extends ItemView {
  private static readonly defaultDisplayText = "Timeline";
  private static readonly titleFormat = "MMM YYYY";
  private timeline?: Component;
  private dateRange?: DateRange;
  private readonly isInSidebar = writable(false);

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settingsStore: Writable<DayPlannerSettings>,
    private readonly componentContext: ComponentContext,
    private readonly dateRanges: DateRanges,
    private readonly periodicNotes: PeriodicNotes,
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly initWeeklyView: () => Promise<void>,
    private readonly reSync: () => void,
    private readonly openTimelineSettingsModal: OpenTimelineSettingsModal,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeTimeline;
  }

  getDisplayText(): string {
    const selectedDay = this.getSelectedDay();

    if (this.isMountedInSidebar() || !selectedDay) {
      return TimelineView.defaultDisplayText;
    }

    return selectedDay.format(TimelineView.titleFormat);
  }

  getIcon() {
    return get(this.settingsStore).timelineIcon;
  }

  onPaneMenu(menu: Menu, source: string) {
    super.onPaneMenu(menu, source);

    addTimelineViewMenuItems(menu, {
      reSync: this.reSync,
      initWeeklyView: this.initWeeklyView,
      openTimelineSettingsModal: this.openTimelineSettingsModal,
      settingsStore: this.settingsStore,
      openFileForDay: (day: Moment) => this.workspaceFacade.openFileForDay(day),
      getSelectedDay: this.getSelectedDay,
    });
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    isNotVoid(contentEl);

    const dateRange = this.dateRanges.trackRange([window.moment()]);

    this.dateRange = dateRange;
    this.register(
      toStore(() => dateRange.current).subscribe(this.updateTabTitleAndHeader),
    );
    this.registerEvent(
      this.workspaceFacade.onActiveLeafChange((leaf) => {
        if (!this.dateRange) {
          return;
        }

        handleActiveLeafChange(leaf, this.dateRange, this.periodicNotes);
      }),
    );

    // Note: a leaf can be dragged between the sidebar and the main area
    this.registerEvent(
      this.workspaceFacade.onLayoutChange(this.updateTabTitleAndHeader),
    );

    const context = new Map<string, unknown>([
      ...this.componentContext,
      [dateRangeContextKey, this.dateRange],
      [isInSidebarContextKey, this.isInSidebar],
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
    this.dateRange = undefined;
  }

  private isMountedInSidebar() {
    return this.workspaceFacade.isLeafInSidebar(this.leaf);
  }

  private getSelectedDay = () => {
    if (!this.dateRange) {
      return undefined;
    }

    return this.dateRange.current[0];
  };

  private updateTabTitleAndHeader = () => {
    this.isInSidebar.set(this.isMountedInSidebar());

    setViewTitle(this, this.getDisplayText());
  };
}
