import { TFile, Vault } from "obsidian";
import { isInstanceOf } from "typed-assert";

import type { TasksApiV1 } from "../tasks-plugin";
import { toggleCheckbox, updateLine } from "../util/markdown";

export class VaultFacade {
  constructor(
    private readonly vault: Vault,
    private readonly getTasksApi: () => TasksApiV1 | undefined,
  ) {}

  async editFile(path: string, editFn: (contents: string) => string) {
    const file = this.getFileByPath(path);

    await this.vault.process(file, editFn);
  }

  async createFile(path: string, contents: string) {
    const folders = path.split("/").slice(0, -1);

    for (let index = 1; index <= folders.length; index++) {
      const folderPath = folders.slice(0, index).join("/");

      if (!this.checkFileExists(folderPath)) {
        await this.vault.createFolder(folderPath);
      }
    }

    await this.vault.create(path, contents);
  }

  async editLineInFile(
    path: string,
    lineNumber: number,
    editFn: (line: string) => string,
  ) {
    await this.editFile(path, (contents) =>
      updateLine(contents, lineNumber, editFn),
    );
  }

  toggleCheckboxInFile = async (path: string, lineNumber: number) => {
    const tasksApi = this.getTasksApi();

    const editFn = tasksApi
      ? (lineContents: string) =>
          tasksApi.executeToggleTaskDoneCommand(lineContents, path)
      : toggleCheckbox;

    await this.editLineInFile(path, lineNumber, editFn);
  };

  getFileByPath(path: string) {
    const file = this.vault.getAbstractFileByPath(path);

    isInstanceOf(file, TFile, `${path} is not a markdown file`);

    return file;
  }

  checkFileExists(path: string) {
    return this.vault.getAbstractFileByPath(path) !== null;
  }
}
