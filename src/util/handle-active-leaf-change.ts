import { FileView, WorkspaceLeaf } from "obsidian";
import { getDateFromFile } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { visibleDayInTimeline } from "../global-store/visible-day-in-timeline";

import { isToday } from "./moment";

export function handleActiveLeafChange({ view }: WorkspaceLeaf) {
  if (!(view instanceof FileView) || !view.file) {
    return;
  }

  const dayUserSwitchedTo = getDateFromFile(view.file, "day");

  if (dayUserSwitchedTo?.isSame(get(visibleDayInTimeline), "day")) {
    return;
  }

  if (!dayUserSwitchedTo) {
    if (isToday(get(visibleDayInTimeline))) {
      visibleDayInTimeline.set(window.moment());
    }

    return;
  }

  visibleDayInTimeline.set(dayUserSwitchedTo);
}
