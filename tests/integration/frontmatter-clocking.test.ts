import { Effect } from "effect";
import { describe, expect, test, vi } from "vitest";

import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

describe("Frontmatter clocking in", () => {
  test("Clocks in on a file with a closed log entry", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { frontmatterLogEntryEditor, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await Effect.runPromise(
      frontmatterLogEntryEditor.clockInAtPath(
        "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock in on a file with an active clock", async () => {
    const { frontmatterLogEntryEditor } = await setUp({
      loadedFixtures: ["frontmatter-1-open-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        frontmatterLogEntryEditor.clockInAtPath(
          "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
        ),
      ),
    ).rejects.toThrow("There is already an open clock");
  });
});

describe("Frontmatter clocking out", () => {
  test("Clocks out on a file with an active clock", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 18:30") });

    const { frontmatterLogEntryEditor, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-open-log-entry.md"],
    });

    await Effect.runPromise(
      frontmatterLogEntryEditor.clockOutAtPath(
        "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock out on a file without an active clock", async () => {
    const { frontmatterLogEntryEditor } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        frontmatterLogEntryEditor.clockOutAtPath(
          "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
        ),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});

describe("Frontmatter canceling clocks", () => {
  test("Cancels an active clock", async () => {
    const { frontmatterLogEntryEditor, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-open-log-entry.md"],
    });

    await Effect.runPromise(
      frontmatterLogEntryEditor.cancelClockAtPath(
        "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not touch a file without an active clock", async () => {
    const { frontmatterLogEntryEditor } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        frontmatterLogEntryEditor.cancelClockAtPath(
          "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
        ),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});

describe("Editing the last frontmatter log entry", () => {
  test("Patches start and end of the last log entry", async () => {
    const { frontmatterLogEntryEditor, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await Effect.runPromise(
      frontmatterLogEntryEditor.editLastClockAtPath(
        "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
        { start: "2025-07-19 13:00", end: "2025-07-19 15:00" },
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });
});
