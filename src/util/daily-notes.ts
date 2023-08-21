import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
  getDateUID,
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

export function getNeighborNotes(dailyNoteKey: string) {
  // todo: this might slow us down
  const sortedNoteKeys = Object.keys(getAllDailyNotes()).sort();
  const currentNoteIndex = sortedNoteKeys.findIndex(
    (key) => key === dailyNoteKey,
  );

  const previousNoteKey = sortedNoteKeys[currentNoteIndex - 1];
  const nextNoteKey = sortedNoteKeys[currentNoteIndex + 1];

  return { previousNoteKey, nextNoteKey };
}

export function getDateUidFromFile(file: TFile) {
  const date = getDateFromFile(file, "day");

  if (!date) {
    return null;
  }

  return getDateUID(date, "day");
}

export function getDateUidForToday() {
  return getDateUID(window.moment(), "day");
}
