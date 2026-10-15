import type { Moment } from "moment";
import { normalizePath } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { DayPlannerSettings } from "../settings";

import type { PeriodicNotes } from "./periodic-notes";
import type { VaultFacade } from "./vault-facade";

const pendingSharedNotes = new WeakMap<
  VaultFacade,
  Map<string, Promise<void>>
>();

async function createSharedPlannerNote(path: string, vaultFacade: VaultFacade) {
  if (vaultFacade.checkFileExists(path)) {
    return;
  }

  let pending = pendingSharedNotes.get(vaultFacade);
  if (!pending) {
    pending = new Map();
    pendingSharedNotes.set(vaultFacade, pending);
  }

  if (!pending.has(path)) {
    pending.set(path, vaultFacade.createFile(path, ""));
  }

  try {
    await pending.get(path);
  } finally {
    pending.delete(path);
  }
}

export function getSharedPlannerNotePath(value = "") {
  const path = value.trim().replaceAll("\\", "/");

  if (!path) {
    return undefined;
  }

  if (
    path.startsWith("/") ||
    /^[a-z]:/i.test(path) ||
    path.split("/").includes("..") ||
    path.endsWith("/")
  ) {
    throw new Error("Planner note must be a file path relative to the vault.");
  }

  return normalizePath(path.endsWith(".md") ? path : `${path}.md`).replaceAll(
    "\\",
    "/",
  );
}

export function getPlannerNotePath(
  day: Moment,
  settings: DayPlannerSettings,
  periodicNotes: PeriodicNotes,
) {
  return (
    getSharedPlannerNotePath(settings.plannerNotePath) ??
    periodicNotes.createDailyNotePath(day)
  );
}

export async function createPlannerNote(
  path: string,
  settings: DayPlannerSettings,
  periodicNotes: PeriodicNotes,
  vaultFacade: VaultFacade,
) {
  if (path === getSharedPlannerNotePath(settings.plannerNotePath)) {
    await createSharedPlannerNote(path, vaultFacade);
    return;
  }

  const day = periodicNotes.getDateFromPath(path, "day");
  isNotVoid(day);
  await periodicNotes.createDailyNote(day);
}

export async function getOrCreatePlannerNote(
  day: Moment,
  settings: DayPlannerSettings,
  periodicNotes: PeriodicNotes,
  vaultFacade: VaultFacade,
) {
  const sharedPath = getSharedPlannerNotePath(settings.plannerNotePath);

  if (!sharedPath) {
    return periodicNotes.createDailyNoteIfNeeded(day);
  }

  if (!vaultFacade.checkFileExists(sharedPath)) {
    await createPlannerNote(sharedPath, settings, periodicNotes, vaultFacade);
  }

  return vaultFacade.getFileByPath(sharedPath);
}
