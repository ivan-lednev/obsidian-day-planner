import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
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

export function getMomentFromUid(uid: string) {
  const dailyNote = getAllDailyNotes()[uid];

  if (!dailyNote) {
    throw new Error(`No daily note: ${uid}`);
  }

  return getDateFromFile(dailyNote, "day");
}
