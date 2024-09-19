import type { Moment } from "moment/moment";
import { App, FileView, MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import { isInstanceOf, isNotVoid } from "typed-assert";

import type { TasksApiV1 } from "../tasks-plugin-types";

function doesLeafContainFile(leaf: WorkspaceLeaf, file: TFile) {
  const { view } = leaf;

  return view instanceof FileView && view.file === file;
}

// todo: make more robust
function toggleCheckbox(line: string) {
  if (line.includes("[ ]")) {
    return line.replace("[ ]", "[x]");
  }

  return line.replace("[x]", "[ ]");
}

export class ObsidianFacade {
  constructor(readonly app: App) {}

  async openFileInEditor(file: TFile) {
    const leafWithThisFile = this.app.workspace
      .getLeavesOfType("markdown")
      .find((leaf) => doesLeafContainFile(leaf, file));

    if (leafWithThisFile) {
      this.app.workspace.setActiveLeaf(leafWithThisFile, { focus: true });

      if (leafWithThisFile.view instanceof MarkdownView) {
        return leafWithThisFile.view.editor;
      }
    } else {
      const newLeaf = this.app.workspace.getLeaf(false);

      await newLeaf.openFile(file);

      if (newLeaf.view instanceof MarkdownView) {
        return newLeaf.view.editor;
      }
    }
  }

  getLastCaretLocation = () => {
    const view = this.getActiveMarkdownView();

    const file = view.file;

    isNotVoid(file, "There is no file in view");

    const path = file.path;
    const line = view.editor.getCursor().line;

    return { path, line };
  };

  async openFileForDay(moment: Moment) {
    const dailyNote =
      getDailyNote(moment, getAllDailyNotes()) ||
      (await createDailyNote(moment));

    return this.openFileInEditor(dailyNote);
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

    if (!editor) {
      return;
    }

    this.app.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line });

    editor.setCursor({ line, ch: editor.getLine(line).length });
  }

  async editFile(path: string, editFn: (contents: string) => string) {
    const file = this.app.vault.getAbstractFileByPath(path);

    isInstanceOf(file, TFile, `${path} is not a markdown file`);

    const contents = await this.app.vault.read(file);
    const newContents = editFn(contents);

    await this.app.vault.modify(file, newContents);
  }

  async editLineInFile(
    path: string,
    line: number,
    editFn: (line: string) => string,
  ) {
    await this.editFile(path, (contents) => {
      const lines = contents.split("\n");
      const originalLine = lines[line];

      isNotVoid(originalLine, `No line ${line} in ${path}`);

      lines[line] = editFn(originalLine);

      return lines.join("\n");
    });
  }

  toggleCheckboxInFile = async (path: string, line: number) => {
    const tasksApi: TasksApiV1 | undefined =
      // @ts-expect-error
      this.app.plugins.plugins["obsidian-tasks-plugin"]?.apiV1;

    const editFn = tasksApi
      ? (lineContents: string) =>
          tasksApi.executeToggleTaskDoneCommand(lineContents, path)
      : toggleCheckbox;

    await this.editLineInFile(path, line, editFn);
  };

  private getFileByPath(path: string) {
    const file = this.app.vault.getAbstractFileByPath(path);

    isInstanceOf(file, TFile, `Unable to open file: ${path}`);

    return file;
  }
}
