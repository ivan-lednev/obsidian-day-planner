import { Menu } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { DayPlannerSettings, TimelineColumns } from "../settings";

export function createColumnSelectionMenu(props: {
  settings: Writable<DayPlannerSettings>;
  event: MouseEvent;
}) {
  const { settings, event } = props;

  const { planner, timeTracker } = get(settings).timelineColumns;

  function updateColumns(next: TimelineColumns) {
    settings.update((previous) => ({
      ...previous,
      timelineColumns: next,
    }));
  }

  new Menu()
    .addItem((item) =>
      item
        .setTitle("Show Planner")
        .setChecked(planner && !timeTracker)
        .onClick(() => {
          updateColumns({
            planner: true,
            timeTracker: false,
          });
        }),
    )
    .addItem((item) =>
      item
        .setTitle("Show Time Tracker")
        .setChecked(!planner && timeTracker)
        .onClick(() => {
          updateColumns({
            planner: false,
            timeTracker: true,
          });
        }),
    )
    .addItem((item) =>
      item
        .setTitle("Show Planner & Time Tracker")
        .setChecked(planner && timeTracker)
        .onClick(() => {
          updateColumns({
            planner: true,
            timeTracker: true,
          });
        }),
    )
    .showAtMouseEvent(event);
}
