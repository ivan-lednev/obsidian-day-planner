import { Menu } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";

export function createColumnChangeMenu(props: {
  event: MouseEvent;
  settingsStore: Writable<DayPlannerSettings>;
}) {
  const { event, settingsStore } = props;

  const currentMode = get(settingsStore).multiDayRange;
  const menu = new Menu();

  menu.addItem((item) =>
    item
      .setTitle("Full week")
      .setChecked(currentMode === "full-week")
      .onClick(() => {
        settingsStore.update((previous) => ({
          ...previous,
          multiDayRange: "full-week",
        }));
      }),
  );
  menu.addItem((item) => {
    item
      .setTitle("Work week")
      .setChecked(currentMode === "work-week")
      .onClick(() => {
        settingsStore.update((previous) => ({
          ...previous,
          multiDayRange: "work-week",
        }));
      });
  });
  menu.addItem((item) => {
    item
      .setTitle("3 days")
      .setChecked(currentMode === "3-days")
      .onClick(() => {
        settingsStore.update((previous) => ({
          ...previous,
          multiDayRange: "3-days",
        }));
      });
  });

  menu.showAtMouseEvent(event);
}
