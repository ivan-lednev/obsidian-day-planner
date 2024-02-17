import { TFile } from "obsidian";

export function anyOf(files: TFile[]) {
  return files.map((file) => `"${file.path}"`).join(" OR ");
}

export function andNot(a: string, b: string) {
  return b ? `${a} AND -(${b})` : a;
}
