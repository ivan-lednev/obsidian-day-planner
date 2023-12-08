import type { Moment } from "moment/moment";
import type { App } from "obsidian";
import { MarkdownView, TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import { isInstanceOf } from "typed-assert";

export class ObsidianFacade {
  constructor(readonly app: App) {}

  async openFileInEditor(file: TFile) {
    const leaf = this.app.workspace.getLeaf(false);

    await leaf.openFile(file);

    return this.app.workspace.activeEditor?.editor;
  }

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

  getActiveMarkdownView = () => {
    const view = this.app.workspace.getMostRecentLeaf()?.view;

    isInstanceOf(view, MarkdownView, "No markdown editor is active");

    return view;
  };

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
}
