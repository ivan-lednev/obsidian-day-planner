import { Effect } from "effect";
import { describe, expect, test, vi } from "vitest";

import { editYaml, requireProps } from "../../src/service/edit-yaml";
import {
  addOpenClock,
  addOpenClockOrCreateProps,
  cancelOpenClock,
  clockOut,
} from "../../src/util/props";
import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

describe("Clocking in", () => {
  test("Creates a new props block when clocking in on a task without log entries", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { logEntryEditor, vault } = await setUp({
      loadedFixtures: ["2025-07-19.md"],
    });

    await Effect.runPromise(
      // todo: all the tests should be wired through this abstraction
      logEntryEditor.clockIn({
        path: "fixtures/fixture-vault/2025-07-19.md",
        position: {
          start: { line: 12, col: 0, offset: 153 },
          end: { line: 12, col: 10, offset: 163 },
        },
      }),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Clocks in on tasks with existing clocks", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["test.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inListItemProps("fixtures/fixture-vault/test.md", 7),
        requireProps(addOpenClock),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock in on bullet list items", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["2025-07-19.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inListItemProps(
            "fixtures/fixture-vault/2025-07-19.md",
            0,
          ),
          requireProps(addOpenClock),
        ),
      ),
    ).rejects.toThrow("Cannot add props to an item that's not a task");
  });

  test("Does not clock in on tasks with active clocks", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["one-task-two-log-records.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inListItemProps(
            "fixtures/fixture-vault/one-task-two-log-records.md",
            0,
          ),
          requireProps(addOpenClock),
        ),
      ),
    ).rejects.toThrow("There is already an open clock");
  });

  test.todo("Does not mess up other child blocks in list");

  test.todo("Keeps other props as is");

  test.todo(
    "For a single line in a file, adds a newline instead of appending the code block to the line",
  );

  test.todo(
    "If a property block is messed up, it replaces it instead of adding another one",
  );
});

describe("Clocking out", () => {
  test("Clocks out on tasks", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 18:30") });

    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["one-task-two-log-records.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inListItemProps(
          "fixtures/fixture-vault/one-task-two-log-records.md",
          0,
        ),
        requireProps(clockOut),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock out on tasks without a clock", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["test.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inListItemProps("fixtures/fixture-vault/test.md", 7),
          requireProps(clockOut),
        ),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});

describe("Canceling clocks", () => {
  test("Cancels clocks", async () => {
    const { yamlEditTargets, vault } = await setUp({
      loadedFixtures: ["one-task-two-log-records.md"],
    });

    await Effect.runPromise(
      editYaml(
        yamlEditTargets.inListItemProps(
          "fixtures/fixture-vault/one-task-two-log-records.md",
          0,
        ),
        requireProps(cancelOpenClock),
      ),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not touch a file without an active clock", async () => {
    const { yamlEditTargets } = await setUp({
      loadedFixtures: ["test.md"],
    });

    await expect(
      Effect.runPromise(
        editYaml(
          yamlEditTargets.inListItemProps("fixtures/fixture-vault/test.md", 7),
          requireProps(cancelOpenClock),
        ),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});
