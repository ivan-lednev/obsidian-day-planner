import type { Moment } from "moment/moment";
import type { App } from "obsidian";
import { MarkdownView, TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { isInstanceOf, isNotVoid } from "typed-assert";

import { parsePlanItems } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";

export class ObsidianFacade {
  constructor(
    readonly app: App,
    private readonly settings: () => DayPlannerSettings,
  ) {}

  async openFileInEditor(file: TFile) {
    const leaf = this.app.workspace.getLeaf(false);

    await leaf.openFile(file);

    return this.app.workspace.activeEditor?.editor;
  }

  // todo: this class should not know about daily notes
  async openFileForDay(moment: Moment) {
    const dailyNote =
      getDailyNote(moment, getAllDailyNotes()) ||
      (await createDailyNote(moment));

    return this.openFileInEditor(dailyNote);
  }

  private getFileByPath(path: string) {
    const file = this.app.vault.getAbstractFileByPath(path);

    isInstanceOf(file, TFile, `Unable to open file: ${path}`);

    return file;
  }

  getMetadataForPath(path: string) {
    const file = this.getFileByPath(path);

    return this.app.metadataCache.getFileCache(file);
  }

  async revealLineInFile(path: string, line: number) {
    const file = this.getFileByPath(path);

    const editor = await this.openFileInEditor(file);

    this.app.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line });

    editor.setCursor({ line, ch: 0 });
  }

  async editFile(path: string, editFn: (contents: string) => string) {
    const file = this.app.vault.getAbstractFileByPath(path);

    isInstanceOf(file, TFile, `${path} is not a markdown file`);

    const contents = await this.app.vault.read(file);
    const newContents = editFn(contents);

    await this.app.vault.modify(file, newContents);
  }

  // todo: move to plan-editor. it should be a wrapper for plans
  async getPlanItemsFromFile(file: TFile) {
    if (!file) {
      return [];
    }

    const { plannerHeading } = this.settings();

    const fileContents = await this.app.vault.read(file);
    const metadata = this.app.metadataCache.getFileCache(file);

    const fileDay = getDateFromFile(file, "day");

    isNotVoid(
      fileDay,
      `Tried to parse plan in file that is not a daily note: ${file.path}`,
    );

    return parsePlanItems(
      fileContents,
      metadata,
      plannerHeading,
      file.path,
      fileDay,
    );
  }
}
