import { TFile } from "obsidian";

export function anyOf(files: TFile[]) {
  return files.map((file) => `"${file.path}"`).join(" OR ");
}
