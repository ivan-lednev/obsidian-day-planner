import { TFile } from "obsidian";
import { get } from "svelte/store";

import { appStore } from "../global-stores/app-store";

// todo: delete this once we've replaced the hooks

export async function openFileInEditor(file: TFile) {
  // todo: obsidian helpers should not depend on Svelte code
  const app = get(appStore);

  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  return app.workspace.activeEditor?.editor;
}

export function getFileByPath(path: string) {
  const app = get(appStore);

  const file = app.vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    throw new Error(`Unable to open file: ${path}`);
  }

  return file;
}
