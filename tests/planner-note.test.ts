import type { Vault } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import { createUpdateHandler } from "../src/create-update-handler";
import { TransactionWriter } from "../src/service/diff-writer";
import type { PeriodicNotes } from "../src/service/periodic-notes";
import {
  getOrCreatePlannerNote,
  getPlannerNotePath,
  getSharedPlannerNotePath,
} from "../src/service/planner-note";
import { VaultFacade } from "../src/service/vault-facade";
import { defaultSettingsForTests } from "../src/settings";
import { EditMode } from "../src/ui/hooks/use-edit/types";
import { create } from "../src/util/time-block-utils";

import { createInMemoryFile } from "./util/fakes";

function setUp(confirmCreation = true, planText = "Plan") {
  const settings = {
    ...defaultSettingsForTests,
    plannerNotePath: "Plans/Work/All days.md",
  };
  const files = new Map<string, ReturnType<typeof createInMemoryFile>>();
  const folders = new Set<string>();
  const vault = {
    getAbstractFileByPath: (path: string) =>
      files.get(path) ?? (folders.has(path) ? { path } : null),
    createFolder: vi.fn(async (path: string) => {
      folders.add(path);
    }),
    create: vi.fn(async (path: string, contents: string) => {
      if (files.has(path)) {
        throw new Error("File already exists");
      }
      const file = createInMemoryFile({ path, contents });
      files.set(path, file);
      return file;
    }),
    process: vi.fn(
      async (file: { path: string }, edit: (text: string) => string) => {
        const stored = files.get(file.path)!;
        stored.contents = edit(stored.contents);
        return stored.contents;
      },
    ),
  };
  const dailyNote = createInMemoryFile({
    path: "Daily/2025-07-19.md",
    contents: "",
  });
  const periodicNotesMock = {
    createDailyNotePath: vi.fn((day) => `Daily/${day.format("YYYY-MM-DD")}.md`),
    createDailyNoteIfNeeded: vi.fn(async () => dailyNote),
    getDateFromPath: vi.fn(),
    createDailyNote: vi.fn(),
  };
  const periodicNotes = periodicNotesMock as unknown as PeriodicNotes;
  const vaultFacade = new VaultFacade(
    vault as unknown as Vault,
    () => undefined,
  );
  const transactionWriter = new TransactionWriter(vaultFacade);
  const onEditCanceled = vi.fn();
  const getConfirmationInput = vi.fn(async () => confirmCreation);
  const handler = createUpdateHandler({
    getSettings: () => settings,
    periodicNotes,
    vaultFacade,
    transactionWriter,
    onEditCanceled,
    onEditConfirmed: vi.fn(),
    getTextInput: async () => planText,
    getConfirmationInput,
  });

  async function createPlan(day: string) {
    const block = create({
      startTime: window.moment(`${day} 09:00`),
      settings,
    });
    return handler([], [block], EditMode.CREATE);
  }

  return {
    settings,
    files,
    vault,
    vaultFacade,
    periodicNotes,
    periodicNotesMock,
    transactionWriter,
    onEditCanceled,
    getConfirmationInput,
    createPlan,
    dailyNote,
  };
}

describe("Planner note", () => {
  test.each([
    ["", undefined],
    ["  ", undefined],
    ["Plans", "Plans.md"],
    [" Plans\\Work.md ", "Plans/Work.md"],
  ])("Normalizes the vault-relative path %j", (input, expected) => {
    expect(getSharedPlannerNotePath(input)).toBe(expected);
  });

  test.each([
    "/Plans.md",
    "C:\\Plans.md",
    "../Plans.md",
    "Plans/../Work.md",
    "Plans/",
  ])("Rejects a path that is not a vault-relative file: %s", (path) =>
    expect(() => getSharedPlannerNotePath(path)).toThrow(
      "relative to the vault",
    ),
  );

  test("Creates the note and missing folders once when opening different days", async () => {
    const { settings, vault, vaultFacade, periodicNotes, periodicNotesMock } =
      setUp();
    const first = await getOrCreatePlannerNote(
      window.moment("2025-07-19"),
      settings,
      periodicNotes,
      vaultFacade,
    );
    const second = await getOrCreatePlannerNote(
      window.moment("2025-07-20"),
      settings,
      periodicNotes,
      vaultFacade,
    );

    expect(second).toBe(first);
    expect(vault.create).toHaveBeenCalledTimes(1);
    expect(vault.createFolder.mock.calls).toEqual([["Plans"], ["Plans/Work"]]);
    expect(periodicNotesMock.createDailyNoteIfNeeded).not.toHaveBeenCalled();
  });

  test("Uses daily notes when the setting is blank", async () => {
    const {
      settings,
      vault,
      vaultFacade,
      periodicNotes,
      periodicNotesMock,
      dailyNote,
    } = setUp();
    const dailySettings = { ...settings, plannerNotePath: "" };
    const day = window.moment("2025-07-19");

    expect(getPlannerNotePath(day, dailySettings, periodicNotes)).toBe(
      dailyNote.path,
    );
    expect(
      await getOrCreatePlannerNote(
        day,
        dailySettings,
        periodicNotes,
        vaultFacade,
      ),
    ).toBe(dailyNote);
    expect(periodicNotesMock.createDailyNoteIfNeeded).toHaveBeenCalledWith(day);
    expect(vault.create).not.toHaveBeenCalled();
  });

  test("Creates one shared note when two days are opened concurrently", async () => {
    const { settings, vault, vaultFacade, periodicNotes } = setUp();
    const notes = await Promise.all(
      ["2025-07-19", "2025-07-20"].map((day) =>
        getOrCreatePlannerNote(
          window.moment(day),
          settings,
          periodicNotes,
          vaultFacade,
        ),
      ),
    );

    expect(notes[1]).toBe(notes[0]);
    expect(vault.create).toHaveBeenCalledTimes(1);
  });

  test("Keeps a block reference containing zero at the end when adding a date", async () => {
    const { settings, files, createPlan } = setUp(true, "Plan ^abc0");
    await createPlan("2025-07-19");

    expect(files.get(settings.plannerNotePath)!.contents).toMatch(
      /Plan ⏳ 2025-07-19 \^abc0$/m,
    );
  });

  test("Creates a missing shared note through the timeline edit handler and supports undo", async () => {
    const {
      settings,
      files,
      createPlan,
      getConfirmationInput,
      periodicNotesMock,
      transactionWriter,
    } = setUp();

    expect(await createPlan("2025-07-19")).toBe(true);
    expect(getConfirmationInput).toHaveBeenCalledTimes(1);
    expect(files.size).toBe(1);
    expect(files.get(settings.plannerNotePath)!.contents).toContain(
      "Plan ⏳ 2025-07-19",
    );
    expect(periodicNotesMock.createDailyNote).not.toHaveBeenCalled();

    await transactionWriter.undo();
    expect(files.get(settings.plannerNotePath)!.contents).toBe("");
  });

  test("Does not create a file when creation is canceled", async () => {
    const { files, createPlan, onEditCanceled } = setUp(false);
    expect(await createPlan("2025-07-19")).toBe(false);
    expect(files.size).toBe(0);
    expect(onEditCanceled).toHaveBeenCalledTimes(1);
  });

  test("Preserves both plans when two appends run concurrently", async () => {
    const { settings, files, createPlan, periodicNotes, vaultFacade } = setUp();
    await getOrCreatePlannerNote(
      window.moment("2025-07-19"),
      settings,
      periodicNotes,
      vaultFacade,
    );
    await Promise.all([createPlan("2025-07-19"), createPlan("2025-07-20")]);
    const contents = files.get(settings.plannerNotePath)!.contents;
    expect(contents).toContain("Plan ⏳ 2025-07-19");
    expect(contents).toContain("Plan ⏳ 2025-07-20");
  });
});
