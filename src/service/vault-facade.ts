import { TFile, Vault } from "obsidian";
import { isInstanceOf } from "typed-assert";

import type { TasksApiV1 } from "../tasks-plugin";
import { toggleCheckbox, updateLine } from "../util/util";

export class VaultFacade {
  constructor(
    private readonly vault: Vault,
    private readonly getTasksApi: () => TasksApiV1 | undefined,
  ) {}

  async editFile(path: string, editFn: (contents: string) => string) {
    const file = this.getFileByPath(path);

    const contents = await this.vault.read(file);
    const newContents = editFn(contents);

    await this.vault.modify(file, newContents);
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
