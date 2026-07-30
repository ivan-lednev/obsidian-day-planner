import { describe, expect, test } from "vitest";

import { createDeleteTimeBlockHandler } from "../../src/create-update-handler";
import { defaultSettingsForTests } from "../../src/settings";
import type { PlanTimeBlock } from "../../src/time-block-types";
import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

describe("Deleting tasks", () => {
  test(`Deletes a parent task together with its nested subtree`, async () => {
    const { vault, findByText, periodicNotes, transactionWriter } = await setUp(
      {
        visibleDays: ["2025-07-28"],
      },
    );

    const deleteTimeBlock = createDeleteTimeBlockHandler({
      getSettings: () => defaultSettingsForTests,
      periodicNotes,
      transactionWriter,
      onConfirmed: () => {},
    });

    await deleteTimeBlock(findByText("Parent") as PlanTimeBlock);

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Deletes a task with a subtask that has no list item paragraphs", async () => {
    const { vault, findByText, periodicNotes, transactionWriter } = await setUp(
      {
        visibleDays: ["2025-07-29"],
      },
    );

    const deleteTimeBlock = createDeleteTimeBlockHandler({
      getSettings: () => defaultSettingsForTests,
      periodicNotes,
      transactionWriter,
      onConfirmed: () => {},
    });

    await deleteTimeBlock(
      findByText(
        "Task with subtasks without list item paragraphs",
      ) as PlanTimeBlock,
    );

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });
});
