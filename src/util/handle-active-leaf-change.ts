import { FileView, WorkspaceLeaf } from "obsidian";

import type { DateRange } from "../redux/date-ranges";
import type { PeriodicNotes } from "../service/periodic-notes";

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
    !dayUserSwitchedTo ||
    dayUserSwitchedTo.isSame(timelineDateRange.first, "day")
  ) {
    return;
  }

  timelineDateRange.set([dayUserSwitchedTo]);
}
