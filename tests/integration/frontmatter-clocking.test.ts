import { Effect } from "effect";
import { describe, expect, test, vi } from "vitest";

import { editYaml, requireProps } from "../../src/service/edit-yaml";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  editLastLogEntry,
} from "../../src/util/props";
import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

describe("Frontmatter clocking in", () => {
  test("Clocks in on a file with a closed log entry", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inFrontmatter(
          "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
        ),
        requireProps(addOpenClock),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock in on a file with an active clock", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["frontmatter-1-open-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inFrontmatter(
            "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
          ),
          requireProps(addOpenClock),
        ),
      ),
    ).rejects.toThrow("There is already an open clock");
  });
});

describe("Frontmatter clocking in on a file with no frontmatter yet", () => {
  test("Creates a fresh frontmatter block when clocking in through the log entry editor", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { logEntryEditor, vault } = await setUp({
      loadedFixtures: [
        "frontmatter-0-no-frontmatter.md",
        "frontmatter-1-closed-log-entry.md",
      ],
    });

    await Effect.runPromise(
      // todo: all the tests should be wired through this abstraction
      logEntryEditor.clockIn({
        path: "fixtures/fixture-vault/frontmatter-0-no-frontmatter.md",
      }),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });
});

describe("Frontmatter clocking out", () => {
  test("Clocks out on a file with an active clock", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 18:30") });

    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-open-log-entry.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inFrontmatter(
          "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
        ),
        requireProps(clockOut),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock out on a file without an active clock", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inFrontmatter(
            "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
          ),
          requireProps(clockOut),
        ),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});

describe("Frontmatter canceling clocks", () => {
  test("Cancels an active clock", async () => {
    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-open-log-entry.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inFrontmatter(
          "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
        ),
        requireProps(cancelOpenClock),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not touch a file without an active clock", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inFrontmatter(
            "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
          ),
          requireProps(cancelOpenClock),
        ),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});

describe("Deleting frontmatter log entries", () => {
  test("Deletes the entry matching the original start", async () => {
    const { logEntryEditor, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await Effect.runPromise(
      logEntryEditor.deleteClock(
        {
          path: "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
        },
        "2025-07-19 12:00",
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not touch a file when no entry matches", async () => {
    const { logEntryEditor } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await expect(
      Effect.runPromise(
        logEntryEditor.deleteClock(
          {
            path: "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
          },
          "2020-01-01 00:00",
        ),
      ),
    ).rejects.toThrow("Log entry not found: 2020-01-01 00:00");
  });
});

describe("Editing the last frontmatter log entry", () => {
  test("Patches start and end of the last log entry", async () => {
    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["frontmatter-1-closed-log-entry.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inFrontmatter(
          "fixtures/fixture-vault/frontmatter-1-closed-log-entry.md",
        ),
        requireProps((props) =>
          editLastLogEntry(props, {
            start: "2025-07-19 13:00",
            end: "2025-07-19 15:00",
          }),
        ),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });
});
