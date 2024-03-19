import { Moment } from "moment";
import { FileView, WorkspaceLeaf } from "obsidian";
import { getDateFromFile } from "obsidian-daily-notes-interface";
import { get, Writable } from "svelte/store";

export function handleActiveLeafChange(
  leaf: WorkspaceLeaf | null,
  timelineDateRange: Writable<Moment[]>,
) {
  if (!(leaf?.view instanceof FileView) || !leaf?.view.file) {
    return;
  }

  const dayUserSwitchedTo = getDateFromFile(leaf.view.file, "day");

  if (
    dayUserSwitchedTo?.isSame(get(timelineDateRange)?.[0], "day") ||
    !dayUserSwitchedTo
  ) {
    return;
  }

  timelineDateRange.set([dayUserSwitchedTo]);
}
