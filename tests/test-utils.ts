import { TFile } from "obsidian";

export function createInMemoryFile(props: { path: string; contents: string }) {
  const mockTFile = Object.create(TFile.prototype);

  return Object.assign(mockTFile, { ...props });
}

export interface InMemoryFile {
  path: string;
  contents: string;
}

export class InMemoryVault {
  constructor(readonly files: Array<InMemoryFile>) {}

  async read(file: TFile) {
    return this.getAbstractFileByPath(file.path).contents;
  }

  async modify(file: TFile, contents: string) {
    const found = this.getAbstractFileByPath(file.path);

    found.contents = contents;
  }

  getAbstractFileByPath(path: string) {
    const found = this.files.find((file) => file.path === path);

    if (!found) {
      throw new Error(`There is no file in the test vault: '${path}'`);
    }

    return found;
  }
}
