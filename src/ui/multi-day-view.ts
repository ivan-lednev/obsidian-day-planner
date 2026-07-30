import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import { derived, get, toStore, type Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { dateRangeContextKey, viewTypeMultiDay } from "../constants";
import type { DateRange, DateRanges } from "../redux/date-ranges";
import type { DayPlannerSettings } from "../settings";
import type { ComponentContext } from "../types";
import * as r from "../util/range";
import { setViewTitle } from "../util/view";

import MultiDayGrid from "./components/multi-day/multi-day-grid.svelte";

export default class MultiDayView extends ItemView {
  private static readonly defaultDisplayText = "Multi-Day View";
  navigation = true;
  private multiDayComponent?: object;
  private dateRange?: DateRange;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settingsStore: Writable<DayPlannerSettings>,
    private readonly componentContext: ComponentContext,
    private readonly dateRanges: DateRanges,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeMultiDay;
  }

  getDisplayText(): string {
    if (!this.dateRange) {
      return MultiDayView.defaultDisplayText;
    }

    return r.toString(this.dateRange.current);
  }

  getIcon() {
    return "table-2";
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    isNotVoid(contentEl);

    const currentSettings = get(this.settingsStore);

    const range = r.createRange(
      currentSettings.multiDayRange,
      currentSettings.firstDayOfWeek,
    );

    const dateRange = this.dateRanges.trackRange(range);

    this.dateRange = dateRange;
    this.register(
      toStore(() => dateRange.current).subscribe(this.updateTabTitleAndHeader),
    );

    const relevantSettingsSignal = derived(
      this.settingsStore,
      ($settingsStore) => {
        return {
          multiDayRange: $settingsStore.multiDayRange,
          firstDayOfWeek: $settingsStore.firstDayOfWeek,
        };
      },
    );

    // todo: remove manual state synchronization
    const initialSettings = get(this.settingsStore);
    let previousMultiDayRange = initialSettings.multiDayRange;
    let previousFirstDayOfWeek = initialSettings.firstDayOfWeek;

    this.register(
      relevantSettingsSignal.subscribe((next) => {
        if (
          next.multiDayRange !== previousMultiDayRange ||
          next.firstDayOfWeek !== previousFirstDayOfWeek
        ) {
          previousMultiDayRange = next.multiDayRange;
          previousFirstDayOfWeek = next.firstDayOfWeek;

          this.dateRange?.set(
            r.createRange(next.multiDayRange, next.firstDayOfWeek),
          );
        }
      }),
    );

    const context = new Map([
      ...this.componentContext,
      [dateRangeContextKey, this.dateRange],
    ]);

    this.multiDayComponent = mount(MultiDayGrid, {
      target: contentEl,
      context,
    });
  }

  async onClose() {
    if (this.multiDayComponent) {
      await unmount(this.multiDayComponent);
    }

    this.dateRange?.untrack();
    this.dateRange = undefined;
  }

  private updateTabTitleAndHeader = () => {
    setViewTitle(this, this.getDisplayText());
  };
}
