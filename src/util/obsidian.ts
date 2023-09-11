import type { Moment } from "moment";
import { MarkdownView, TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { appStore } from "../global-stores/app-store";
import { settings } from "../global-stores/settings";
import { computeOverlap } from "../overlap/overlap";
import { parsePlanItems } from "../parser/parser";
import type { PlanItem } from "../types";

import { getHorizontalPlacing } from "./horizontal-placing";

export async function openFileInEditor(file: TFile) {
  const app = get(appStore);

  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  return app.workspace.activeEditor?.editor;
}

export async function openFileForDay(moment: Moment) {
  const dailyNote =
    getDailyNote(moment, getAllDailyNotes()) || (await createDailyNote(moment));

  return openFileInEditor(dailyNote);
}

export function getFileByPath(path: string) {
  const app = get(appStore);

  const file = app.vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    throw new Error(`Unable to open file: ${path}`);
  }

  return file;
}

export async function revealLineInFile(path: string, line: number) {
  const file = getFileByPath(path);

  const editor = await openFileInEditor(file);
  get(appStore)
    .workspace.getActiveViewOfType(MarkdownView)
    ?.setEphemeralState({ line });

  editor.setCursor({ line, ch: 0 });
}

// todo: rename to calculateOverlap
export function addPlacing(planItems: PlanItem[]) {
  const overlapLookup = computeOverlap(planItems);

  return planItems.map((planItem) => {
    const overlap = overlapLookup.get(planItem.id);

    return {
      ...planItem,
      // todo: rename to overlap
      placing: getHorizontalPlacing(overlap),
    };
  });
}

export function toPlacedWritables(planItems: PlanItem[]) {
  const planItemsWithPlacing = addPlacing(planItems);
  return writable(planItemsWithPlacing);
}

export async function getPlanItemsFromFile(file: TFile) {
  if (!file) {
    return [];
  }

  const app = get(appStore);
  const { plannerHeading } = get(settings);

  const fileContents = await app.vault.cachedRead(file);
  const metadata = app.metadataCache.getFileCache(file);

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
