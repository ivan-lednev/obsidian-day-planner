import { TFile } from "obsidian";
import { appStore, getTimelineFile, tasks } from "../store/timeline-store";
import { get } from "svelte/store";
import { parsePlanItems } from "../parser/parser";
import { settings } from "../store/settings";

export async function openFileInEditor(file: TFile) {
  const app = get(appStore);

  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  return app.workspace.activeEditor?.editor;
}

export async function getFileByPath(path: string) {
  const app = get(appStore);

  const file = app.vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    throw new Error(`Unable to open file: ${path}`);
  }

  return file;
}

export async function refreshPlanItemsInStore() {
  const parsedPlanItems = await getPlanItemsFromFile(getTimelineFile());

  tasks.update(() => parsedPlanItems);
}

async function getPlanItemsFromFile(file: TFile) {
  if (!file) {
    return [];
  }

  const app = get(appStore);
  const { plannerHeading } = get(settings);

  const fileContents = await app.vault.cachedRead(file);
  const metadata = app.metadataCache.getFileCache(file);

  return parsePlanItems(fileContents, metadata, plannerHeading, file.path);
}
