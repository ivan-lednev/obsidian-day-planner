import type { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { derived, Readable } from "svelte/store";

import { addPlacing } from "../../overlap/overlap";
import type { ObsidianFacade } from "../../service/obsidian-facade";

interface CreateParsedTasksProps {
  day: Readable<Moment>;
  obsidianFacade: ObsidianFacade;
}

export function createParsedTasks({
  day,
  obsidianFacade,
}: CreateParsedTasksProps) {
  return derived(
    day,
    ($day, set) => {
      const note = getDailyNote($day, getAllDailyNotes());

      obsidianFacade
        .getPlanItemsFromFile(note)
        .then((parsedTasks) => set(addPlacing(parsedTasks)));
    },
    [],
  );
}
