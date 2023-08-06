import { Vault, normalizePath } from "obsidian";
import { DAY_PLANNER_DEFAULT_CONTENT, DAY_PLANNER_FILENAME } from "./constants";
import MomentDateRegex from "./moment-date-regex";
import {
  DayPlannerSettings,
  NoteForDateQuery,
  NoteForDate,
} from "./settings";
import {
  appHasDailyNotesPluginLoaded,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";
import { DayPlannerMode } from "./types";

export default class DayPlannerFile {
  private readonly momentDateRegex: MomentDateRegex;
  private readonly noteForDateQuery: NoteForDateQuery;

  constructor(
    private readonly vault: Vault,
    private readonly settings: DayPlannerSettings,
  ) {
    this.momentDateRegex = new MomentDateRegex();
    this.noteForDateQuery = new NoteForDateQuery();
  }

  async hasTodayNote(): Promise<boolean> {
    if (
      this.settings.mode === DayPlannerMode.DAILY &&
      appHasDailyNotesPluginLoaded()
    ) {
      const date = new Date();
      const { folder, format } = getDailyNoteSettings();
      const filename = this.momentDateRegex.getMoment(date, format) + ".md";
      const path = normalizePath(folder + "/" + filename);
      if (await this.vault.adapter.exists(path)) {
        const noteForDate = new NoteForDate(path, date.toDateString());
        this.settings.notesToDates = [noteForDate];
        return true;
      }
      return false;
    }

    return this.noteForDateQuery.exists(this.settings.notesToDates);
  }

  getTodayPlannerFilePath(): string {
    if (this.settings.mode === DayPlannerMode.DAILY) {
      return this.noteForDateQuery.active(this.settings.notesToDates).notePath;
    }
    const fileName = this.todayPlannerFileName();
    return `${this.settings.customFolder ?? "Day Planners"}/${fileName}`;
  }

  todayPlannerFileName(): string {
    return this.momentDateRegex.replace(DAY_PLANNER_FILENAME);
  }

  async prepareFile() {
    await this.createFileIfNotExists(this.getTodayPlannerFilePath());
  }

  async createFolderIfNotExists(path: string) {
    const normalizedPath = normalizePath(path);
    const folderExists = await this.vault.adapter.exists(normalizedPath, false);
    if (!folderExists) {
      await this.vault.createFolder(normalizedPath);
    }
  }

  async createFileIfNotExists(fileName: string) {
    const normalizedFileName = normalizePath(fileName);
    if (!(await this.vault.adapter.exists(normalizedFileName, false))) {
      await this.vault.create(normalizedFileName, DAY_PLANNER_DEFAULT_CONTENT);
    }
  }

  async getPlannerContents(fileName: string) {
    await this.prepareFile();
    return await this.vault.adapter.read(fileName);
  }

  async updateFile(fileName: string, fileContents: string) {
    await this.prepareFile();
    return await this.vault.adapter.write(
      normalizePath(fileName),
      fileContents,
    );
  }
}
