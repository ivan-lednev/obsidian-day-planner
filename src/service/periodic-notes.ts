import type { Moment } from "moment";
import { normalizePath, type TFile } from "obsidian";
import {
  getAllDailyNotes,
  getDailyNote,
  getDateFromPath,
  createDailyNote,
  getDateFromFile,
  DEFAULT_DAILY_NOTE_FORMAT,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";

export class PeriodicNotes {
  readonly DEFAULT_DAILY_NOTE_FORMAT = DEFAULT_DAILY_NOTE_FORMAT;

  getDailyNote(day: Moment, dailyNotes: Record<string, TFile>): TFile | null {
    return getDailyNote(day, dailyNotes);
  }

  getAllDailyNotes() {
    return getAllDailyNotes();
  }

  createDailyNote(day: Moment) {
    return createDailyNote(day);
  }

  getDateFromPath(path: string, type: "day" | "month" | "year") {
    return getDateFromPath(path, type);
  }

  getDateFromFile(file: TFile, type: "day" | "month" | "year") {
    return getDateFromFile(file, type);
  }

  getDailyNoteSettings() {
    return getDailyNoteSettings();
  }

  createDailyNoteIfNeeded(moment: Moment) {
    return (
      this.getDailyNote(moment, this.getAllDailyNotes()) ||
      this.createDailyNote(moment)
    );
  }

  createDailyNotePath(date: Moment) {
    const { format = this.DEFAULT_DAILY_NOTE_FORMAT, folder = "." } =
      this.getDailyNoteSettings();

    let filename = date.format(format);

    if (!filename.endsWith(".md")) {
      filename += ".md";
    }

    return normalizePath(join(folder, filename));
  }
}

// Copied from obsidian-daily-notes-interface
function join(...partSegments: string[]) {
  // Split the inputs into a list of path commands.
  let parts: string[] = [];
  for (let i = 0, l = partSegments.length; i < l; i++) {
    parts = parts.concat(partSegments[i].split("/"));
  }
  // Interpret the path commands to get the new resolved path.
  const newParts: string[] = [];
  for (let i = 0, l = parts.length; i < l; i++) {
    const part = parts[i];
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part || part === ".") continue;
    // Push new path segments.
    else newParts.push(part);
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === "") newParts.unshift("");
  // Turn back into a single string path.
  return newParts.join("/");
}
