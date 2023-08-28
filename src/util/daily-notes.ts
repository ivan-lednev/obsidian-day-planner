import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
  getDateUID,
} from "obsidian-daily-notes-interface";

import { getDaysOfCurrentWeek } from "./moment";

export async function createDailyNoteIfNeeded(moment: Moment): Promise<TFile> {
  return getDailyNote(moment, getAllDailyNotes()) || createDailyNote(moment);
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

export function getNotesForWeek() {
  return getDaysOfCurrentWeek()
    .map((moment) => getDateUID(moment, "day"))
    .map((uid) => ({ id: uid, note: getAllDailyNotes()[uid] }));
}

export function getNotesForDays(days: Moment[]) {
  return days.map((day) => getDailyNote(day, getAllDailyNotes()));
}
