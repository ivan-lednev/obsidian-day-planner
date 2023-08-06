import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import type { TFile } from "obsidian";

export async function createDailyNoteIfNeeded(): Promise<TFile> {
  const now = window.moment();

  const existingNote = getDailyNote(now, getAllDailyNotes());
  if (existingNote) {
    return existingNote;
  }

  return createDailyNote(now);
}

export function dailyNoteExists() {
  return Boolean(getDailyNote(window.moment(), getAllDailyNotes()));
}
