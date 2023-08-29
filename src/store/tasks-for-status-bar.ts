import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived } from "svelte/store";

import { getPlanItemsFromFile } from "../util/obsidian";

import { visibleDayInTimeline } from "./visible-day-in-timeline";

// todo: this could probably be reused in timeline & week view
export const tasksForStatusBar = derived(
  visibleDayInTimeline,
  ($day, set) => {
    const note = getDailyNote($day, getAllDailyNotes());

    getPlanItemsFromFile(note).then(set);
  },
  [],
);
