import { Effect } from "effect";
import { isNotVoid } from "typed-assert";
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
      taskEntryEditor.editProps({
        path: "fixtures/fixture-vault/test.md",
        line: 7,
        editFn: (props) => {
          isNotVoid(props);

          return addOpenClock(props);
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
        taskEntryEditor.editProps({
          path: "fixtures/fixture-vault/2025-07-19.md",
          line: 0,
          editFn: () => createPropsWithOpenClock(),
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
        taskEntryEditor.editProps({
          path: "fixtures/fixture-vault/one-task-two-log-records.md",
          line: 0,
          editFn: (props) => {
            isNotVoid(props);

            return addOpenClock(props);
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
  test.todo("Clocks out on tasks");

  test.todo("Does not clock out on tasks without a clock");
});

describe("Canceling clocks", () => {
  test.todo("Cancels clocks");

  test.todo("Does not touch a file without an active clock");
});
