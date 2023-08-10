import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import type { TFile } from "obsidian";

export async function createDailyNoteIfNeeded(): Promise<TFile> {
  return getDailyNoteForToday() || createDailyNote(window.moment());
}

export function getDailyNoteForToday() {
  return getDailyNote(window.moment(), getAllDailyNotes());
}

export function dailyNoteExists() {
  return Boolean(getDailyNote(window.moment(), getAllDailyNotes()));
}
