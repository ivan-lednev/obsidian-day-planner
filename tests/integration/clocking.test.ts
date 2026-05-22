import { Effect } from "effect";
import { describe, expect, test, vi } from "vitest";

import { addOpenClock, createPropsWithOpenClock } from "../../src/util/props";
import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

describe("Clocking in", () => {
  test("Clocks in on tasks without clocks", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { taskEntryEditor, vault } = await setUp({
      loadedFixtures: ["2025-07-19.md"],
    });

    await Effect.runPromise(
      taskEntryEditor.editProps({
        path: "fixtures/fixture-vault/2025-07-19.md",
        line: 12,
        editFn: (props) =>
          props ? addOpenClock(props) : createPropsWithOpenClock(),
      }),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Clocks in on tasks with existing clocks", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

    const { taskEntryEditor, vault } = await setUp({
      loadedFixtures: ["test.md"],
    });

    await Effect.runPromise(
      taskEntryEditor.clockInAtLocation({
        path: "fixtures/fixture-vault/test.md",
        position: {
          start: { line: 7, col: 2, offset: 0 },
          end: { line: 7, col: 2, offset: 0 },
        },
      }),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock in on bullet list items", async () => {
    const { taskEntryEditor } = await setUp({
      loadedFixtures: ["2025-07-19.md"],
    });

    await expect(
      Effect.runPromise(
        taskEntryEditor.clockInAtLocation({
          path: "fixtures/fixture-vault/2025-07-19.md",
          position: {
            start: { line: 0, col: 0, offset: 0 },
            end: { line: 0, col: 0, offset: 0 },
          },
        }),
      ),
    ).rejects.toThrow("Cannot add props to an item that's not a task");
  });

  test("Does not clock in on tasks with active clocks", async () => {
    const { taskEntryEditor } = await setUp({
      loadedFixtures: ["one-task-two-log-records.md"],
    });

    await expect(
      Effect.runPromise(
        taskEntryEditor.clockInAtLocation({
          path: "fixtures/fixture-vault/one-task-two-log-records.md",
          position: {
            start: { line: 0, col: 0, offset: 0 },
            end: { line: 0, col: 0, offset: 0 },
          },
        }),
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

    const { taskEntryEditor, vault } = await setUp({
      loadedFixtures: ["one-task-two-log-records.md"],
    });

    await Effect.runPromise(
      taskEntryEditor.clockOutAtLocation({
        path: "fixtures/fixture-vault/one-task-two-log-records.md",
        position: {
          start: { line: 0, col: 0, offset: 0 },
          end: { line: 0, col: 0, offset: 0 },
        },
      }),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not clock out on tasks without a clock", async () => {
    const { taskEntryEditor } = await setUp({
      loadedFixtures: ["test.md"],
    });

    await expect(
      Effect.runPromise(
        taskEntryEditor.clockOutAtLocation({
          path: "fixtures/fixture-vault/test.md",
          position: {
            start: { line: 7, col: 2, offset: 0 },
            end: { line: 7, col: 2, offset: 0 },
          },
        }),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});

describe("Canceling clocks", () => {
  test("Cancels clocks", async () => {
    const { taskEntryEditor, vault } = await setUp({
      loadedFixtures: ["one-task-two-log-records.md"],
    });

    await Effect.runPromise(
      taskEntryEditor.cancelClockAtLocation({
        path: "fixtures/fixture-vault/one-task-two-log-records.md",
        position: {
          start: { line: 0, col: 0, offset: 0 },
          end: { line: 0, col: 0, offset: 0 },
        },
      }),
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Does not touch a file without an active clock", async () => {
    const { taskEntryEditor } = await setUp({
      loadedFixtures: ["test.md"],
    });

    await expect(
      Effect.runPromise(
        taskEntryEditor.cancelClockAtLocation({
          path: "fixtures/fixture-vault/test.md",
          position: {
            start: { line: 7, col: 2, offset: 0 },
            end: { line: 7, col: 2, offset: 0 },
          },
        }),
      ),
    ).rejects.toThrow("There is no open clock");
  });
});
