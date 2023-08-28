import type { Moment } from "moment";
import { TFile } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
  getDateUID,
} from "obsidian-daily-notes-interface";
import { get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { computeOverlap } from "../parser/overlap";
import { parsePlanItems } from "../parser/parser";
import { getTimelineFile } from "../store/active-day";
import { appStore } from "../store/app-store";
import { DateRange, dateRange } from "../store/date-range";
import { getHorizontalPlacing } from "../store/horizontal-placing";
import { settings } from "../store/settings";
import { planItemsByDateUid, tasks } from "../store/tasks";
import type { PlanItem } from "../types";

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

export async function getFileByPath(path: string) {
  const app = get(appStore);

  const file = app.vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    throw new Error(`Unable to open file: ${path}`);
  }

  return file;
}

export function addPlacing(planItems: PlanItem[]) {
  const overlapLookup = computeOverlap(planItems);

  return planItems.map((planItem) => {
    const overlap = overlapLookup.get(planItem.id);

    return {
      ...planItem,
      placing: getHorizontalPlacing(overlap),
    };
  });
}

export async function refreshPlanItemsInStore() {
  // -- todo: derive this from dateRange?

  const currentDateRange = get(dateRange);

  isNotVoid(currentDateRange);

  // todo: this API is very confusing
  const notesForWeek = currentDateRange.dates.map((date, i) => ({
    id: getDateUID(date, "day"),
    note: currentDateRange.dailyNotes[i],
  }));

  const idToPlanItemsStore = await Promise.all(
    notesForWeek.map(async ({ id, note }) => {
      const planItems = note ? await getPlanItemsFromFile(note) : [];
      const planItemsWithPlacing = addPlacing(planItems);
      return [id, writable(planItemsWithPlacing)];
    }),
  );

  const parsedPlanItemsForWeek = Object.fromEntries(idToPlanItemsStore);

  planItemsByDateUid.set(parsedPlanItemsForWeek);
  // ---

  // todo: remove this old code
  const parsedPlanItems = await getPlanItemsFromFile(getTimelineFile());

  tasks.set(parsedPlanItems);
}

// todo: delete
export async function refreshPlanItemsInStoreWithRange(
  currentDateRange: DateRange,
) {
  const notesForWeek = currentDateRange.dates.map((date, i) => ({
    id: getDateUID(date, "day"),
    note: currentDateRange.dailyNotes[i],
  }));

  const idToPlanItemsStore = await Promise.all(
    notesForWeek.map(async ({ id, note }) => {
      const planItems = note ? await getPlanItemsFromFile(note) : [];
      const planItemsWithPlacing = addPlacing(planItems);
      return [id, writable(planItemsWithPlacing)];
    }),
  );

  const parsedPlanItemsForWeek = Object.fromEntries(idToPlanItemsStore);

  planItemsByDateUid.set(parsedPlanItemsForWeek);

  // todo: remove this old code
  const parsedPlanItems = await getPlanItemsFromFile(getTimelineFile());

  tasks.set(parsedPlanItems);
}
async function getPlanItemsFromFile(file: TFile) {
  if (!file) {
    return [];
  }

  const app = get(appStore);
  const { plannerHeading } = get(settings);

  const fileContents = await app.vault.cachedRead(file);
  const metadata = app.metadataCache.getFileCache(file);

  const fileDay = getDateFromFile(file, "day");

  if (!fileDay) {
    throw new Error(
      `Tried to parse plan in file that is not a daily note: ${file.path}`,
    );
  }

  return parsePlanItems(
    fileContents,
    metadata,
    plannerHeading,
    file.path,
    fileDay,
  );
}
