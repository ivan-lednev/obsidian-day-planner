import { Menu } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { DayPlannerSettings, TimelineColumnType } from "../settings";

const columnTitles: Record<TimelineColumnType, string> = {
  planner: "Show planner",
  timeTracker: "Show time tracker",
};

export function addColumnSelectionItems(props: {
  menu: Menu;
  settings: Writable<DayPlannerSettings>;
  section?: string;
}) {
  const { menu, settings, section } = props;

  const currentColumns = get(settings).timelineColumns;
  const visibleColumnCount =
    Object.values(currentColumns).filter(Boolean).length;

  Object.entries(columnTitles).forEach(([column, title]) => {
    const isVisible = currentColumns[column as TimelineColumnType];
    const isLastVisibleColumn = isVisible && visibleColumnCount === 1;

    menu.addItem((item) => {
      if (section) {
        item.setSection(section);
      }

      item
        .setTitle(title)
        .setChecked(isVisible)
        .setDisabled(isLastVisibleColumn)
        .onClick(() => {
          if (isLastVisibleColumn) {
            return;
          }

          settings.update((previous) => ({
            ...previous,
            timelineColumns: {
              ...previous.timelineColumns,
              [column]: !isVisible,
            },
          }));
        });
    });
  });
}

export function createColumnSelectionMenu(props: {
  settings: Writable<DayPlannerSettings>;
  event: MouseEvent;
}) {
  const { settings, event } = props;
  const menu = new Menu();

  addColumnSelectionItems({ menu, settings });

  menu.showAtMouseEvent(event);
}
