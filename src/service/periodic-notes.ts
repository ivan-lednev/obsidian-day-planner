import type { Moment } from "moment";
import { normalizePath, type TFile, type Vault } from "obsidian";
import {
  getDailyNote,
  getDateFromPath as getDateFromPathViaLibrary,
  getDateUID,
  createDailyNote,
  DEFAULT_DAILY_NOTE_FORMAT,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import { isNotVoid } from "typed-assert";

import { getDateFromDailyNotePath, getFolderPrefix } from "./daily-note-date";

export class PeriodicNotes {
  readonly DEFAULT_DAILY_NOTE_FORMAT = DEFAULT_DAILY_NOTE_FORMAT;

  constructor(private readonly vault: Vault) {}

  getDailyNote(day: Moment, dailyNotes: Record<string, TFile>): TFile | null {
    return getDailyNote(day, dailyNotes);
  }

  getAllDailyNotes() {
    const { folder = "" } = this.getDailyNoteSettings();

    const prefix = getFolderPrefix(folder);
    const dailyNotes: Record<string, TFile> = {};

    for (const file of this.vault.getFiles()) {
      if (!file.path.endsWith(".md")) {
        continue;
      }

      if (prefix && !file.path.startsWith(prefix)) {
        continue;
      }

      const date = this.getDateFromPath(file.path, "day");

      if (date) {
        dailyNotes[getDateUID(date, "day")] = file;
      }
    }

    return dailyNotes;
  }

  createDailyNote(day: Moment) {
    return createDailyNote(day);
  }

  getDateFromPath(path: string, type: "day" | "month" | "year") {
    if (type === "day") {
      const { format = this.DEFAULT_DAILY_NOTE_FORMAT, folder = "" } =
        this.getDailyNoteSettings();

      const date = getDateFromDailyNotePath({ path, format, folder });

      if (date) {
        return date;
      }
    }

    return getDateFromPathViaLibrary(path, type);
  }

  getDateFromFile(file: TFile, type: "day" | "month" | "year") {
    return this.getDateFromPath(file.path, type);
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
    const partSegment = partSegments[i];

    isNotVoid(partSegment);

    parts = parts.concat(partSegment.split("/"));
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
