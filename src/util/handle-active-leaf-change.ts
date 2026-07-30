import { FileView, WorkspaceLeaf } from "obsidian";

import type { PeriodicNotes } from "../service/periodic-notes";
import type { DateRange } from "../types";

export function handleActiveLeafChange(
  leaf: WorkspaceLeaf | null,
  timelineDateRange: DateRange,
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
    dayUserSwitchedTo?.isSame(timelineDateRange.current[0], "day") ||
    !dayUserSwitchedTo
  ) {
    return;
  }

  timelineDateRange.set([dayUserSwitchedTo]);
}
