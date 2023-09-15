import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";

export async function createDailyNoteIfNeeded(moment: Moment): Promise<TFile> {
  return getDailyNote(moment, getAllDailyNotes()) || createDailyNote(moment);
}

export function dailyNoteExists() {
  return Boolean(getDailyNote(window.moment(), getAllDailyNotes()));
}
