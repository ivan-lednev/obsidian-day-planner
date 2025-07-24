import type { Moment } from "moment";
import { FileView, WorkspaceLeaf } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { PeriodicNotes } from "../service/periodic-notes";

export function handleActiveLeafChange(
  leaf: WorkspaceLeaf | null,
  timelineDateRange: Writable<Moment[]>,
  periodicNotes: PeriodicNotes,
) {
  if (!(leaf?.view instanceof FileView) || !leaf?.view.file) {
    return;
  }

  const dayUserSwitchedTo = periodicNotes.getDateFromFile(
    leaf.view.file,
    "day",
  );

  if (
    dayUserSwitchedTo?.isSame(get(timelineDateRange)?.[0], "day") ||
    !dayUserSwitchedTo
  ) {
    return;
  }

  timelineDateRange.set([dayUserSwitchedTo]);
}
